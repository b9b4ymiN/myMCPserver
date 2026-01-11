import axios from 'axios';
import * as cheerio from 'cheerio';
import { Tool } from '../types/index.js';
import { API_CONFIG } from '../config/index.js';
import { ToolCategory } from '../types/tool-descriptions.js';

// =====================================================
// WEB SEARCH TOOL (DuckDuckGo - Free, No API Key)
// Search the web for current information and research
// =====================================================

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: string;
}

interface WebSearchResponse {
  query: string;
  totalResults: number;
  results: WebSearchResult[];
  searchTime: number;
}

const webSearchTool: Tool = {
  name: 'web_search',
  description: `Search the web using DuckDuckGo for current information, news, and research. Free search without API key requirements.

**Use Case:** ${ToolCategory.WEB_RESEARCH} - Find current information, news, and research on any topic.

**Best For:**
- Stock news and market updates
- Company research and announcements
- Economic indicator lookup
- Industry trend analysis
- Real-time information gathering

**Inputs:**
- query: Search query (e.g., "Apple stock price", "Tesla earnings 2024")
- maxResults: Maximum number of results (default: 10, range: 1-50)
- timeRange: Time filter for results (default: "all")
  Options: "all" | "day" | "week" | "month" | "year"
- safeSearch: Enable safe search filter (default: true)

**Outputs:**
- results: Array of search results with title, URL, and snippet
- totalResults: Number of results returned
- searchTime: Time taken to search in milliseconds

**Related Tools:** news_search, web_fetch
**DataSource:** DuckDuckGo (web scraping)
**ExecutionTime:** 1-3 seconds
**Caching:** 15 minutes TTL for repeated queries`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (e.g., "Apple stock price", "Tesla earnings 2024", "Bitcoin price today")'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10, max: 50)',
        default: 10,
        minimum: 1,
        maximum: 50
      },
      timeRange: {
        type: 'string',
        description: 'Time filter for search results',
        enum: ['all', 'day', 'week', 'month', 'year'],
        default: 'all'
      },
      safeSearch: {
        type: 'boolean',
        description: 'Enable safe search filter',
        default: true
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    const { query, maxResults = 10, timeRange = 'all', safeSearch = true } = args;

    try {
      const startTime = Date.now();

      // DuckDuckGo HTML version search (no API key needed)
      const searchUrl = 'https://html.duckduckgo.com/html/';
      const params = new URLSearchParams({
        q: query,
        kl: 'us-en',
        df: timeRange === 'day' ? 'd' : timeRange === 'week' ? 'w' : timeRange === 'month' ? 'm' : timeRange === 'year' ? 'y' : '',
        p: safeSearch ? '1' : '-1'
      });

      const response = await axios.post(searchUrl, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: API_CONFIG.TIMEOUT
      });

      const $ = cheerio.load(response.data);
      const results: WebSearchResult[] = [];

      $('.result').each((i, element) => {
        if (i >= maxResults) return false;

        const $result = $(element);
        const title = $result.find('.result__a').text().trim();
        const url = $result.find('.result__a').attr('href') || '';
        const snippet = $result.find('.result__snippet').text().trim();

        // Clean DuckDuckGo redirect URLs
        const cleanUrl = url.replace(/^\/l\/uddss=\d+\/\//, '').replace(/^https?:\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&rut=')[0];
        const decodedUrl = decodeURIComponent(cleanUrl);

        if (title && decodedUrl && decodedUrl.startsWith('http')) {
          results.push({
            title,
            url: decodedUrl,
            snippet
          });
        }
      });

      const searchTime = Date.now() - startTime;

      const result: WebSearchResponse = {
        query,
        totalResults: results.length,
        results,
        searchTime
      };

      return result;
    } catch (error) {
      throw new Error(`Web search failed for "${query}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// =====================================================
// WEB FETCH TOOL - Extract content from URLs
// Fetch and extract clean content from web pages
// =====================================================

interface WebFetchResult {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    publishedDate?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    wordCount: number;
    fetchedAt: string;
  };
  links: {
    internal: string[];
    external: string[];
  };
  images: string[];
}

const webFetchTool: Tool = {
  name: 'web_fetch',
  description: `Fetch and extract readable content from a web page. Automatically removes ads, navigation, and clutter to get clean, structured content.

**Use Case:** ${ToolCategory.WEB_RESEARCH} - Extract main content from articles, blog posts, and news pages for analysis.

**Best For:**
- Reading financial articles and earnings reports
- Extracting content from news sites
- Getting clean text from blog posts
- Research and documentation gathering
- Content analysis and summarization

**Inputs:**
- url: URL to fetch content from (e.g., "https://www.bbc.com/news/business-123456")
- includeLinks: Include links found on the page (default: false)
- includeImages: Include images found on the page (default: false)
- format: Output format (default: "text")
  Options: "text" | "markdown" | "html"

**Outputs:**
- url: Final URL (after redirects)
- title: Page title
- content: Main content in requested format
- metadata: Page metadata (description, author, published date, word count, etc.)
- links: Internal and external links (if requested)
- images: Image URLs (if requested)

**Features:**
- Automatically removes ads, navigation, footers, sidebars
- Extracts main article content
- Supports multiple output formats
- Follows redirects

**Related Tools:** web_search, news_search
**DataSource:** Direct HTTP fetch
**ExecutionTime:** 2-5 seconds
**Caching:** 15 minutes TTL`,
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch content from (e.g., "https://www.bbc.com/news/business-123456")'
      },
      includeLinks: {
        type: 'boolean',
        description: 'Include links found on the page',
        default: false
      },
      includeImages: {
        type: 'boolean',
        description: 'Include images found on the page',
        default: false
      },
      format: {
        type: 'string',
        description: 'Output format for the content',
        enum: ['text', 'markdown', 'html'],
        default: 'text'
      }
    },
    required: ['url']
  },
  handler: async (args) => {
    const { url, includeLinks = false, includeImages = false, format = 'text' } = args;

    try {
      // Validate URL
      let validUrl: string;
      try {
        validUrl = new URL(url.startsWith('http') ? url : `https://${url}`).toString();
      } catch {
        throw new Error('Invalid URL format');
      }

      const response = await axios.get(validUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: API_CONFIG.TIMEOUT,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .comments').remove();

      // Extract metadata
      const metadata = {
        description: $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content'),
        keywords: $('meta[name="keywords"]').attr('content'),
        author: $('meta[name="author"]').attr('content'),
        publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                       $('meta[name="date"]').attr('content') ||
                       $('time[datetime]').attr('datetime'),
        ogImage: $('meta[property="og:image"]').attr('content'),
        ogTitle: $('meta[property="og:title"]').attr('content'),
        ogDescription: $('meta[property="og:description"]').attr('content'),
        wordCount: 0,
        fetchedAt: new Date().toISOString()
      };

      // Extract main content
      const contentSelectors = [
        'article',
        '[role="main"]',
        'main',
        '.content',
        '.post-content',
        '.article-content',
        '.entry-content',
        '#content',
        '.post-body',
        'body'
      ];

      let $content = $();
      for (const selector of contentSelectors) {
        $content = $(selector).first();
        if ($content.length > 0 && $content.text().trim().length > 100) {
          break;
        }
      }

      if ($content.length === 0) {
        $content = $('body');
      }

      // Process content based on format
      let content: string;
      if (format === 'html') {
        content = $content.html() || '';
      } else if (format === 'markdown') {
        content = htmlToMarkdown($content);
      } else {
        content = $content.text().replace(/\s+/g, ' ').trim();
      }

      metadata.wordCount = content.split(/\s+/).length;

      // Extract links
      const links = {
        internal: [] as string[],
        external: [] as string[]
      };

      if (includeLinks) {
        const baseDomain = new URL(validUrl).hostname;

        $content.find('a[href]').each((_, el) => {
          const href = $(el).attr('href');
          if (href && (href.startsWith('http') || href.startsWith('/'))) {
            try {
              const absoluteUrl = href.startsWith('http') ? href : new URL(href, validUrl).toString();
              if (absoluteUrl.includes(baseDomain)) {
                links.internal.push(absoluteUrl);
              } else {
                links.external.push(absoluteUrl);
              }
            } catch {
              // Invalid URL, skip
            }
          }
        });

        links.internal = [...new Set(links.internal)];
        links.external = [...new Set(links.external)];
      }

      // Extract images
      const images: string[] = [];
      if (includeImages) {
        $content.find('img[src]').each((_, el) => {
          const src = $(el).attr('src');
          if (src) {
            try {
              const absoluteUrl = src.startsWith('http') ? src : new URL(src, validUrl).toString();
              images.push(absoluteUrl);
            } catch {
              // Invalid URL, skip
            }
          }
        });
      }

      const result: WebFetchResult = {
        url: validUrl,
        title: $('title').text() || $('h1').first().text() || metadata.ogTitle || 'Untitled',
        content,
        metadata,
        links,
        images
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to fetch URL "${url}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// =====================================================
// NEWS SEARCH TOOL - Financial & Stock News
// Search recent news articles and financial headlines
// =====================================================

interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  snippet: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

interface NewsSearchResponse {
  query: string;
  totalResults: number;
  articles: NewsArticle[];
  searchTime: number;
  sources: string[];
}

const newsSearchTool: Tool = {
  name: 'news_search',
  description: `Search for recent news articles using Google News RSS. Perfect for stock news, company announcements, earnings reports, and financial headlines.

**Use Case:** ${ToolCategory.WEB_RESEARCH} - Find recent news articles and company updates for investment research.

**Best For:**
- Stock news and earnings updates
- Company announcements and press releases
- Financial market news
- Industry news and trends
- Merger and acquisition news

**Inputs:**
- query: News search query (e.g., "Apple stock", "Tesla earnings", "Fed interest rates")
- maxResults: Maximum number of articles (default: 10, range: 1-30)
- source: Specific news source to search (optional, e.g., "bloomberg.com", "reuters.com")
- language: Language for articles (default: "en")
  Options: "en" | "th" | "zh" | "ja" | "ko" | "de" | "fr" | "es"
- sortBy: Sort order (default: "relevance")
  Options: "relevance" | "date"

**Outputs:**
- articles: Array of news articles with title, URL, source, published date
- sentiment: Basic sentiment analysis (positive/negative/neutral)
- sources: List of unique sources found
- totalResults: Number of articles returned
- searchTime: Time taken to search

**Features:**
- Google News RSS integration (free, no API key)
- Multi-language support
- Source filtering
- Sentiment analysis on headlines
- Date-based sorting

**Related Tools:** web_search, web_fetch, fetch_stock_data
**DataSource:** Google News RSS feed
**ExecutionTime:** 1-2 seconds
**Caching:** 10 minutes TTL for news (expires faster due to time sensitivity)`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'News search query (e.g., "Apple stock", "Tesla earnings", "Fed interest rates")'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of articles (default: 10, max: 30)',
        default: 10,
        minimum: 1,
        maximum: 30
      },
      source: {
        type: 'string',
        description: 'Specific news source to search (optional, e.g., "bloomberg.com", "reuters.com")'
      },
      language: {
        type: 'string',
        description: 'Language for news articles',
        enum: ['en', 'th', 'zh', 'ja', 'ko', 'de', 'fr', 'es'],
        default: 'en'
      },
      sortBy: {
        type: 'string',
        description: 'Sort order for results',
        enum: ['relevance', 'date'],
        default: 'relevance'
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    const { query, maxResults = 10, source, language = 'en', sortBy = 'relevance' } = args;

    try {
      const startTime = Date.now();

      // Google News RSS feed (free, no API key)
      const newsUrl = 'https://news.google.com/rss/search';
      const params = new URLSearchParams({
        q: source ? `${query} site:${source}` : query,
        hl: language,
        gl: language === 'th' ? 'TH' : language === 'zh' ? 'CN' : language === 'ja' ? 'JP' : language === 'ko' ? 'KR' : 'US',
        ceid: language === 'th' ? 'TH:th' : language === 'zh' ? 'CN:zh' : language === 'ja' ? 'JP:ja' : language === 'ko' ? 'KR:ko' : 'US:en'
      });

      const response = await axios.get(`${newsUrl}?${params.toString()}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: API_CONFIG.TIMEOUT
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      const articles: NewsArticle[] = [];
      const sources = new Set<string>();

      $('item').each((i, element) => {
        if (i >= maxResults) return false;

        const $item = $(element);
        const title = $item.find('title').text();
        const link = $item.find('link').text();
        const description = $item.find('description').text();
        const pubDate = $item.find('pubDate').text();
        const sourceName = $item.find('source').text() || extractDomainFromUrl(link);

        if (title && link) {
          sources.add(sourceName);

          articles.push({
            title: title.trim(),
            url: link,
            source: sourceName,
            publishedDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            snippet: stripHtmlTags(description).trim(),
            sentiment: analyzeSentiment(title + ' ' + description)
          });
        }
      });

      const searchTime = Date.now() - startTime;

      // Sort by date if requested
      let sortedArticles = articles;
      if (sortBy === 'date') {
        sortedArticles = articles.sort((a, b) =>
          new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
        );
      }

      const result: NewsSearchResponse = {
        query,
        totalResults: articles.length,
        articles: sortedArticles,
        searchTime,
        sources: Array.from(sources)
      };

      return result;
    } catch (error) {
      throw new Error(`News search failed for "${query}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function htmlToMarkdown($content: cheerio.Cheerio<any>): string {
  let markdown = '';

  // Create a new cheerio instance for processing
  const $ = cheerio.load($content.html() || '');

  const processElement = (elem: any): string => {
    const name = elem.name;
    const text = $(elem).text().trim();

    switch (name) {
      case 'h1': return `# ${text}\n\n`;
      case 'h2': return `## ${text}\n\n`;
      case 'h3': return `### ${text}\n\n`;
      case 'h4': return `#### ${text}\n\n`;
      case 'h5': return `##### ${text}\n\n`;
      case 'h6': return `###### ${text}\n\n`;
      case 'p': return `${text}\n\n`;
      case 'br': return '\n';
      case 'strong':
      case 'b': return `**${text}**`;
      case 'em':
      case 'i': return `*${text}*`;
      case 'a': {
        const href = $(elem).attr('href') || '';
        return href ? `[${text}](${href})` : text;
      }
      case 'ul':
      case 'ol': {
        const items = $(elem).find('li').map((_i: number, li: any) => {
          const liText = $(li).text().trim();
          return name === 'ul' ? `- ${liText}` : `1. ${liText}`;
        }).get().join('\n');
        return '\n' + items + '\n\n';
      }
      case 'blockquote': return `> ${text}\n\n`;
      case 'code': return `\`${text}\``;
      case 'pre': return `\`\`\`\n${text}\n\`\`\`\n\n`;
      default:
        return $(elem).contents().map((_i: number, child: any) => {
          if (child.type === 'text') {
            return child.nodeValue || '';
          }
          return processElement(child);
        }).get().join('');
    }
  };

  // Process all top-level elements
  $.root().children().each((_i: number, elem: any) => {
    markdown += processElement(elem);
  });

  return markdown;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'gain', 'profit', 'growth', 'rise', 'surge', 'bullish', 'rally', 'breakthrough',
    'success', 'beat', 'exceed', 'upgrade', 'outperform', 'strong', 'recovery', 'jump'
  ];

  const negativeWords = [
    'loss', 'fall', 'drop', 'decline', 'bearish', 'crash', 'concern', 'risk',
    'miss', 'disappoint', 'downgrade', 'underperform', 'weak', 'recession', 'plunge', 'cut'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// =====================================================
// EXPORT ALL WEB TOOLS
// =====================================================

export const webTools: Tool[] = [
  webSearchTool,
  webFetchTool,
  newsSearchTool
];

export { webSearchTool, webFetchTool, newsSearchTool };

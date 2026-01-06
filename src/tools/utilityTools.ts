import { Tool } from '../types/index.js';

// =====================================================
// TIME & DATE TOOLS
// =====================================================

interface CurrentTimeResult {
  timezone: string;
  currentTime: string;
  iso: string;
  unix: number;
  utc: string;
  date: {
    year: number;
    month: number;
    day: number;
  };
  time: {
    hour: number;
    minute: number;
    second: number;
  };
  dayOfWeek: string;
  dayOfYear: number;
  weekOfYear: number;
  isDST: boolean;
}

const getCurrentTimeTool: Tool = {
  name: 'get_current_time',
  description: 'Get current date/time with timezone support, including ISO format, Unix timestamp, and parsed components',
  inputSchema: {
    type: 'object',
    properties: {
      timezone: {
        type: 'string',
        description: 'IANA timezone (e.g., "America/New_York", "Asia/Bangkok", "Europe/London", "UTC")',
        default: 'UTC'
      },
      format: {
        type: 'string',
        description: 'Output format preference',
        enum: ['iso', 'unix', 'readable', 'all'],
        default: 'all'
      }
    }
  },
  handler: async (args) => {
    const { timezone = 'UTC', format = 'all' } = args;

    try {
      const now = new Date();

      // Get time in specified timezone
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        weekday: 'long',
        timeZoneName: 'short'
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      const parts = formatter.formatToParts(now);
      const partMap = new Map(parts.map(p => [p.type, p.value]));

      // Extract components
      const year = parseInt(partMap.get('year') || '0');
      const month = parseInt(partMap.get('month') || '0');
      const day = parseInt(partMap.get('day') || '0');
      const hour = parseInt(partMap.get('hour') || '0');
      const minute = parseInt(partMap.get('minute') || '0');
      const second = parseInt(partMap.get('second') || '0');
      const dayName = partMap.get('weekday') || '';
      const tzName = partMap.get('timeZoneName') || '';

      // Create formatted strings
      const isoString = now.toISOString();
      const readableString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${tzName}`;

      // Calculate day of year
      const startOfYear = new Date(year, 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      // Calculate week of year
      const weekOfYear = Math.ceil(dayOfYear / 7);

      // Check DST (approximate)
      const stdDate = new Date(year, 0, 1);
      const stdOffset = stdDate.getTimezoneOffset();
      const currentOffset = now.getTimezoneOffset();
      const isDST = currentOffset !== stdOffset;

      // Get UTC time
      const utcString = new Date(now.getTime() + now.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      const result: CurrentTimeResult = {
        timezone,
        currentTime: readableString,
        iso: isoString,
        unix: Math.floor(now.getTime() / 1000),
        utc: utcString,
        date: { year, month, day },
        time: { hour, minute, second },
        dayOfWeek: dayName,
        dayOfYear,
        weekOfYear,
        isDST
      };

      // Return based on format preference
      if (format === 'iso') return { iso: result.iso };
      if (format === 'unix') return { unix: result.unix };
      if (format === 'readable') return { readable: result.currentTime };

      return result;
    } catch (error) {
      throw new Error(`Failed to get current time: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface ConvertTimezoneResult {
  originalTime: string;
  originalTimezone: string;
  targetTime: string;
  targetTimezone: string;
  timeDifference: string;
  iso: string;
  unix: number;
}

const convertTimezoneTool: Tool = {
  name: 'convert_timezone',
  description: 'Convert date/time from one timezone to another',
  inputSchema: {
    type: 'object',
    properties: {
      datetime: {
        type: 'string',
        description: 'Input datetime (ISO format or readable string like "2024-01-15 14:30")'
      },
      fromTimezone: {
        type: 'string',
        description: 'Source timezone (e.g., "America/New_York", "UTC")',
        default: 'UTC'
      },
      toTimezone: {
        type: 'string',
        description: 'Target timezone (e.g., "Asia/Bangkok", "Europe/London")'
      }
    },
    required: ['datetime', 'toTimezone']
  },
  handler: async (args) => {
    const { datetime, fromTimezone = 'UTC', toTimezone } = args;

    try {
      // Parse input datetime
      let date: Date;
      if (datetime.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(datetime)) {
        date = new Date(datetime);
      } else {
        date = new Date();
      }

      if (isNaN(date.getTime())) {
        throw new Error('Invalid datetime format');
      }

      // Format original time
      const originalFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: fromTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });

      // Format target time
      const targetFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: toTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZoneName: 'short'
      });

      const originalTime = originalFormatter.format(date);
      const targetTime = targetFormatter.format(date);

      // Calculate time difference
      const fromDate = new Date(originalTime.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'));
      const toDate = new Date(targetTime.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2'));
      const diffHours = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60));
      const timeDiff = diffHours > 0 ? `+${diffHours}h` : `${diffHours}h`;

      const result: ConvertTimezoneResult = {
        originalTime,
        originalTimezone: fromTimezone,
        targetTime,
        targetTimezone: toTimezone,
        timeDifference: timeDiff,
        iso: date.toISOString(),
        unix: Math.floor(date.getTime() / 1000)
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to convert timezone: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface TimeDiffResult {
  startDate: string;
  endDate: string;
  difference: {
    totalDays: number;
    totalHours: number;
    totalMinutes: number;
    totalSeconds: number;
    weeks: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  humanReadable: string;
}

const calculateTimeDiffTool: Tool = {
  name: 'calculate_time_diff',
  description: 'Calculate the difference between two dates/times in multiple units',
  inputSchema: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Start date (ISO format or readable string)'
      },
      endDate: {
        type: 'string',
        description: 'End date (ISO format or readable string, defaults to now if not provided)'
      }
    },
    required: ['startDate']
  },
  handler: async (args) => {
    const { startDate, endDate } = args;

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date format');
      }

      const diffMs = Math.abs(end.getTime() - start.getTime());

      const totalSeconds = Math.floor(diffMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);
      const weeks = Math.floor(totalDays / 7);

      const days = totalDays % 7;
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;
      const seconds = totalSeconds % 60;

      const parts: string[] = [];
      if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

      const result: TimeDiffResult = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        difference: {
          totalDays,
          totalHours,
          totalMinutes,
          totalSeconds,
          weeks,
          days,
          hours,
          minutes,
          seconds
        },
        humanReadable: parts.join(', ')
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate time difference: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface FormatDateResult {
  input: string;
  formats: {
    iso: string;
    isoDate: string;
    isoTime: string;
    readable: string;
    short: string;
    long: string;
    relative: string;
  };
  parsed: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  };
}

const formatDateTimeTool: Tool = {
  name: 'format_datetime',
  description: 'Format a date string into multiple common formats',
  inputSchema: {
    type: 'object',
    properties: {
      datetime: {
        type: 'string',
        description: 'Input datetime (defaults to current time if not provided)'
      },
      timezone: {
        type: 'string',
        description: 'Timezone for formatting (e.g., "America/New_York", "UTC")',
        default: 'UTC'
      },
      locale: {
        type: 'string',
        description: 'Locale for formatting (e.g., "en-US", "th-TH")',
        default: 'en-US'
      }
    }
  },
  handler: async (args) => {
    const { datetime, timezone = 'UTC', locale = 'en-US' } = args;

    try {
      const date = datetime ? new Date(datetime) : new Date();

      if (isNaN(date.getTime())) {
        throw new Error('Invalid datetime format');
      }

      // ISO formats
      const iso = date.toISOString();
      const isoDate = iso.split('T')[0];
      const isoTime = iso.split('T')[1]?.substring(0, 8) || '00:00:00';

      // Readable format with timezone
      const readableOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'short'
      };
      const readable = new Intl.DateTimeFormat(locale, readableOptions).format(date);

      // Short format
      const shortOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      const short = new Intl.DateTimeFormat(locale, shortOptions).format(date);

      // Long format
      const longOptions: Intl.DateTimeFormatOptions = {
        timeZone: timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZoneName: 'long'
      };
      const long = new Intl.DateTimeFormat(locale, longOptions).format(date);

      // Relative time
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      let relative = '';
      if (diffSec < 60) {
        relative = Math.abs(diffSec) <= 1 ? 'just now' : `${Math.abs(diffSec)} seconds ${diffSec > 0 ? 'ago' : 'from now'}`;
      } else if (diffMin < 60) {
        relative = `${Math.abs(diffMin)} minute${Math.abs(diffMin) > 1 ? 's' : ''} ${diffMin > 0 ? 'ago' : 'from now'}`;
      } else if (diffHour < 24) {
        relative = `${Math.abs(diffHour)} hour${Math.abs(diffHour) > 1 ? 's' : ''} ${diffHour > 0 ? 'ago' : 'from now'}`;
      } else if (diffDay < 7) {
        relative = `${Math.abs(diffDay)} day${Math.abs(diffDay) > 1 ? 's' : ''} ${diffDay > 0 ? 'ago' : 'from now'}`;
      } else {
        relative = readable;
      }

      // Parse components
      const parsed = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
        second: date.getSeconds()
      };

      const result: FormatDateResult = {
        input: datetime || 'now',
        formats: {
          iso,
          isoDate,
          isoTime,
          readable,
          short,
          long,
          relative
        },
        parsed
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to format datetime: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// =====================================================
// EXPORT ALL UTILITY TOOLS
// =====================================================

export const utilityTools: Tool[] = [
  getCurrentTimeTool,
  convertTimezoneTool,
  calculateTimeDiffTool,
  formatDateTimeTool
];

export { getCurrentTimeTool, convertTimezoneTool, calculateTimeDiffTool, formatDateTimeTool };

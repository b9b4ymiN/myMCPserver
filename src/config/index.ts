import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// API Configuration
export const API_CONFIG = {
  // SET Watch API
  SET_WATCH: {
    HOST: process.env.SET_WATCH_API_HOST || 'https://xxxxxx-api.vercel.app',
    TIMEOUT: parseInt(process.env.SET_WATCH_API_TIMEOUT || '30000'),
    HEADERS: {
      'Content-Type': 'application/json',
      ...(process.env.API_AUTH_HEADER && process.env.API_AUTH_VALUE && {
        [process.env.API_AUTH_HEADER]: process.env.API_AUTH_VALUE
      })
    }
  },

  // Alternative API (if configured)
  ALTERNATIVE: {
    HOST: process.env.ALTERNATIVE_API_HOST,
    KEY: process.env.ALTERNATIVE_API_KEY,
    HEADERS: {
      'Content-Type': 'application/json',
      ...(process.env.ALTERNATIVE_API_KEY && {
        'Authorization': `Bearer ${process.env.ALTERNATIVE_API_KEY}`
      })
    }
  },

  // Global settings
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Server Configuration
export const SERVER_CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  PORT: process.env.PORT || 2901
};

// Default headers for API requests
export const DEFAULT_HEADERS = {
  'User-Agent': 'Stock-Valuation-MCP-Server/1.0.0',
  'Accept': 'application/json',
  ...API_CONFIG.SET_WATCH.HEADERS
};

// Helper function to create axios config
export function getAxiosConfig(timeout?: number) {
  return {
    timeout: timeout || API_CONFIG.TIMEOUT,
    headers: DEFAULT_HEADERS
  };
}
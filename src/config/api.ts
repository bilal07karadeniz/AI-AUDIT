/**
 * API Configuration
 * Centralized configuration for backend API endpoints
 */

export const API_CONFIG = {
  // Base URL for backend API
  // In development: http://localhost:3001
  // In production: your deployed backend URL
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',

  // API endpoints
  endpoints: {
    claude: '/api/claude/messages',
    health: '/health'
  },

  // Request configuration
  timeout: 120000, // 2 minutes
  retries: 3,

  // Get full endpoint URL
  getEndpoint(endpoint: keyof typeof API_CONFIG.endpoints): string {
    return `${this.baseUrl}${this.endpoints[endpoint]}`;
  }
};

/**
 * Check if backend server is reachable
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(API_CONFIG.getEndpoint('health'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

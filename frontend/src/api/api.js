// src/api/api.js

/**
 * The base URL is pulled from the environment variable VITE_API_URL.
 * It defaults to http://localhost:4000 for development.
 */
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Custom Error class for API-specific errors.
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Central function to handle all network requests, error parsing, and JSON handling.
 * @param {string} path - The endpoint path (e.g., '/api/rfps').
 * @param {object} [options={}] - Standard fetch options (method, headers, body, etc.).
 * @returns {Promise<object | null>} The parsed JSON data from the response.
 * @throws {ApiError} If the response status is not OK (200-299).
 */
export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  // Convert body object to JSON string if it exists
  const body = options.body && typeof options.body === 'object' 
    ? JSON.stringify(options.body) 
    : options.body;

  const response = await fetch(url, {
    ...options,
    body: body,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  let data = null;
  try {
    // Attempt to parse JSON response
    data = await response.json();
  } catch (e) {
    // Ignore JSON parsing errors for responses like 204 No Content
  }

  if (!response.ok) {
    const errorData = data || { message: response.statusText };
    const status = response.status;
    
    // Throw detailed custom error
    throw new ApiError(
      `API Error [${status}]: ${errorData.message || response.statusText}`,
      status,
      errorData
    );
  }

  return data;
}

// Export the base URL for non-blocking checks in Navbar
export { BASE_URL };
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Utility to get the dynamic API URL for custom domain mapping (الربط)
export const getCustomApiBase = (): string => {
  return localStorage.getItem('TAWSEELA_API_BASE_URL') || (import.meta as any).env.VITE_API_BASE_URL || '';
};

export const setCustomApiBase = (url: string): void => {
  let cleanedUrl = url.trim();
  if (cleanedUrl && cleanedUrl.endsWith('/')) {
    cleanedUrl = cleanedUrl.slice(0, -1);
  }
  if (cleanedUrl) {
    localStorage.setItem('TAWSEELA_API_BASE_URL', cleanedUrl);
  } else {
    localStorage.removeItem('TAWSEELA_API_BASE_URL');
  }
};

export const getApiUrl = (path: string): string => {
  const base = getCustomApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};

// Check if live server-side matching is enabled or if it falls back to simulation
export const isLiveModeEnabled = (): boolean => {
  const val = localStorage.getItem('TAWSEELA_LIVE_MODE_ENABLED');
  return val !== 'false'; // Enabled by default
};

export const setLiveModeEnabled = (enabled: boolean): void => {
  localStorage.setItem('TAWSEELA_LIVE_MODE_ENABLED', enabled ? 'true' : 'false');
};

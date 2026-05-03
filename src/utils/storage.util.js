export const getStorageItem = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    // Guard against the string "undefined" / "null" / empty
    if (!raw || raw === 'undefined' || raw === 'null') return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};
 
/**
 * Safely serialise and store a value.
 * Skips storage if value is undefined to prevent storing "undefined".
 */
export const setStorageItem = (key, value) => {
  if (value === undefined) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode – fail silently
  }
};
 
export const removeStorageItem = (key) => localStorage.removeItem(key);
 
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
 
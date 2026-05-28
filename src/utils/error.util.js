/**
 * error.util.js
 * Tiện ích xử lý và trích xuất thông điệp lỗi từ API response.
 */

export function getErrorMessage(err, defaultMsg = 'Đã xảy ra lỗi.') {
  if (!err) return defaultMsg;
  
  const data = err.response?.data;
  if (!data) {
    return err.message || defaultMsg;
  }
  
  // 1. Nếu data là string
  if (typeof data === 'string') {
    return data;
  }
  
  // 2. Nếu data có trường message hoặc Message
  const msg = data.message || data.Message;
  if (typeof msg === 'string') {
    return msg;
  }
  
  // 3. Nếu data có trường errors (chuẩn RFC 7807 hoặc validation error)
  if (data.errors && typeof data.errors === 'object') {
    if (Array.isArray(data.errors)) {
      return data.errors.join('\n');
    }
    // Nếu errors là object (Map<string, string[]>)
    return Object.values(data.errors)
      .flat()
      .filter(val => typeof val === 'string')
      .join('\n');
  }

  // 4. Nếu data có trường title hoặc detail
  const title = data.title || data.detail;
  if (typeof title === 'string') {
    return title;
  }
  
  // 5. Nếu data là một array
  if (Array.isArray(data)) {
    return data.join('\n');
  }
  
  return defaultMsg;
}

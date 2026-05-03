

const ROLE_CLAIM = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const NAME_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
const ID_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

export const decodeJWT = (token) => {
  if (!token) return null;
  try {
    let base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const json = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  } catch (e) {
    console.error('Lỗi giải mã JWT:', e);
    return null;
  }
};

/**
 * Lấy ID từ JWT.
 *   type='userId'  → ClaimTypes.NameIdentifier = user.Id (dùng CreateBookingVM.khachHangId)
 *   type='roleId'  → payload['RoleId'] = KhachHangId (dùng /api/profiles/customer/{id})
 */
export const getUserIdFromToken = (token, type = 'userId') => {
  const p = decodeJWT(token);
  if (!p) return null;
  if (type === 'roleId') return p['RoleId'] ?? p['roleId'] ?? null;
  return p[ID_CLAIM] ?? p['sub'] ?? p['nameid'] ?? null;
};

export const getRoleFromToken = (token) => {
  const p = decodeJWT(token);
  if (!p) return null;
  return p[ROLE_CLAIM] ?? p['role'] ?? null;
};

// Bổ sung lại hằng số EMAIL_CLAIM 
const EMAIL_CLAIM = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

// Sửa lại hàm getUserFromToken
export const getUserFromToken = (token) => {
  const p = decodeJWT(token);
  if (!p) return null;

  const nameClaim = p[NAME_CLAIM] ?? p['name'] ?? '';
  const isEmail = nameClaim.includes('@');

  return {
    // Thêm lại fallback 'nameid'
    id: p[ID_CLAIM] ?? p['sub'] ?? p['nameid'] ?? '',
    hoTen: isEmail ? '' : nameClaim,
    // Khôi phục lại việc lấy EMAIL_CLAIM chuẩn của .NET
    email: p[EMAIL_CLAIM] ?? p['email'] ?? (isEmail ? nameClaim : ''),
    role: p[ROLE_CLAIM] ?? p['role'] ?? '',
    roleId: p['RoleId'] ?? p['roleId'] ?? '',
  };
};

export const ADMIN_ROLES = ['SuperAdmin', 'Receptionist', 'Housekeeper'];

export const isAdminRole = (role) => {
  if (!role) return false;
  const arr = Array.isArray(role) ? role : [role];
  return arr.some(r => ADMIN_ROLES.includes(r));
};



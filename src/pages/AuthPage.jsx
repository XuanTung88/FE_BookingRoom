
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { profileService } from '../services/profile.service';
import { decodeJWT, getUserFromToken, isAdminRole } from '../utils/jwt.util';
import { setStorageItem } from '../utils/storage.util';
import toast from 'react-hot-toast';

// ─── AuthPage ─────────────────────────────────────────────────────
export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Modal states
  const [showRegisterSuccess, setShowRegisterSuccess] = useState(false);
  const [showProfileModal,    setShowProfileModal]    = useState(false);

  // Temp credentials để auto-login sau khi register
  const [tempCreds, setTempCreds] = useState({ email: '', password: '' });

  // ── Login ─────────────────────────────────────────────────────
  const [loginData,    setLoginData]    = useState({ email: '', password: '' });
  const [loginError,   setLoginError]   = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLoginChange = (e) =>
    setLoginData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    await doLogin(loginData.email, loginData.password);
  };

  const doLogin = async (email, password, isAutoLogin = false) => {
    setLoginError('');
    setLoginLoading(true);
    try {
      const { data } = await authService.login(email, password);

      const rawToken = data.token ?? data.Token ?? data;
      localStorage.setItem('token', rawToken);

      const decoded = decodeJWT(rawToken);

      // Kiểm tra onboarding từ JWT 
      const needsProfile = authService.isOnboardingToken(decoded);

      if (needsProfile) {
        setTempCreds({ email, password });
        const partialUser = getUserFromToken(rawToken);
        if (partialUser) setStorageItem('user', partialUser);
        setShowProfileModal(true);
        return;
      }

      const user = getUserFromToken(rawToken);
      if (user) setStorageItem('user', user);

      if (isAdminRole(user?.role)) {
        navigate('/admin');
      } else {
        const redirect = new URLSearchParams(location.search).get('redirect') || '/';
        navigate(redirect);
      }
    } catch (err) {
      const msg = err.response?.data?.message
        ?? (Array.isArray(err.response?.data) ? err.response.data.join(' ') : null)
        ?? err.response?.data
        ?? 'Sai email hoặc mật khẩu.';
      if (!isAutoLogin) {
        setLoginError(msg);
        toast.error(msg);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────
  const [regData,    setRegData]    = useState({ tenDangNhap: '', hoTen: '', email: '', password: '' });
  const [regError,   setRegError]   = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegChange = (e) =>
    setRegData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    setRegLoading(true);
    try {
      await authService.register(
        regData.tenDangNhap, regData.hoTen,
        regData.email,       regData.password
      );

      setShowRegisterSuccess(true);
      setTempCreds({ email: regData.email, password: regData.password });

    } catch (err) {
      const errors = err.response?.data?.errors;
      let msg = '';
      if (errors) {
        msg = Object.values(errors).flat().join('\n');
      } else {
        msg = err.response?.data?.message ??
          (Array.isArray(err.response?.data) ? err.response.data.join('\n') : null) ??
          'Đã xảy ra lỗi khi đăng ký.';
      }
      setRegError(msg);
      toast.error(msg);
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoToProfile = async () => {
    setShowRegisterSuccess(false);
    await doLogin(tempCreds.email, tempCreds.password, true);
  };

  // ── Profile completion (POST /api/profiles) ───────────────────
  const [profile,        setProfile]        = useState({
    soDienThoai: '', ngaySinh: '', gioiTinh: '', queQuan: '', cccdPassport: '', quocTich: 'Việt Nam',
  });
  const [profileError,   setProfileError]   = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileDone,    setProfileDone]    = useState(false);

  const handleProfileChange = (e) =>
    setProfile(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.soDienThoai.trim()) { setProfileError('Vui lòng nhập số điện thoại.'); return; }
    if (!profile.cccdPassport.trim()) { setProfileError('Vui lòng nhập CCCD / Hộ chiếu.'); return; } // Bổ sung validate nhẹ
    setProfileError('');
    setProfileLoading(true);
    try {
      await profileService.complete(profile); // Gọi API POST /api/profiles

      const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
      setStorageItem('user', { ...existingUser, ...profile, isProfileCompleted: true });

      setProfileDone(true);

    } catch (err) {
      setProfileError(
        err.response?.data?.message ?? err.response?.data ?? 'Lưu thông tin thất bại.'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleRelogin = async () => {
    setShowProfileModal(false);
    setProfileDone(false);
    await doLogin(tempCreds.email, tempCreds.password, false);
  };

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1920&q=80')" }}
      />

      {/* Header */}
      <header className="absolute top-0 left-0 w-full z-50 py-5 px-6 flex justify-between items-center">
        <Link to="/" className="text-3xl font-extrabold tracking-tight text-white">
          Hotel<span className="text-blue-400">MoonLight</span>
        </Link>
        <Link to="/" className="text-white hover:text-blue-300 font-medium transition">
          &larr; Trang chủ
        </Link>
      </header>

      {/* ── Auth Card ──────────────────────────────────────────── */}
      <div className="relative w-full max-w-4xl h-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden z-10 flex">
        
        {/* Form Đăng nhập */}
        <div className={`absolute top-0 left-0 w-1/2 h-full p-12 flex flex-col justify-center items-center bg-white transition-all duration-700 ease-in-out
          ${isLogin ? 'translate-x-0 opacity-100 z-20' : '-translate-x-full opacity-0 z-0'}`}>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-6">Đăng Nhập</h2>

          {loginError && (
            <div className="w-full bg-red-100 text-red-600 p-3 rounded mb-4 text-xs text-center whitespace-pre-line">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
            <input type="email" name="email" placeholder="Email *" required
              onChange={handleLoginChange}
              className="w-full bg-gray-100 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="relative w-full">
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Mật khẩu *" required
                onChange={handleLoginChange}
                className="w-full bg-gray-100 px-4 py-3 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-center">
              <a href="#" className="text-xs text-gray-500 hover:underline">Quên mật khẩu?</a>
            </div>
            <button type="submit" disabled={loginLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 rounded-full uppercase tracking-wider transition">
              {loginLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}
            </button>
          </form>
        </div>

        {/* Form Đăng ký */}
        <div className={`absolute top-0 right-0 w-1/2 h-full p-10 flex flex-col justify-center items-center bg-white transition-all duration-700 ease-in-out
          ${isLogin ? 'translate-x-full opacity-0 z-0' : 'translate-x-0 opacity-100 z-20'}`}>
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Tạo Tài Khoản</h2>

          {regError && (
            <div className="w-full bg-red-100 text-red-600 p-3 rounded mb-2 text-xs text-center whitespace-pre-line">
              {regError}
            </div>
          )}

          <form onSubmit={handleRegSubmit} className="w-full space-y-3">
            <input type="text" name="tenDangNhap" placeholder="Tên đăng nhập *" required
              onChange={handleRegChange}
              className="w-full bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input type="text" name="hoTen" placeholder="Họ và tên *" required
              onChange={handleRegChange}
              className="w-full bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <input type="email" name="email" placeholder="Email *" required
              onChange={handleRegChange}
              className="w-full bg-gray-100 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="relative w-full">
              <input type={showRegPassword ? "text" : "password"} name="password" placeholder="Mật khẩu * (tối thiểu 6 ký tự)" required minLength={6}
                onChange={handleRegChange}
                className="w-full bg-gray-100 px-4 py-2.5 pr-10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button type="button" onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
                {showRegPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            <button type="submit" disabled={regLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3 rounded-full uppercase tracking-wider transition">
              {regLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
            </button>
          </form>
        </div>

        {/* Overlay */}
        <div className={`absolute top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-600 to-teal-400 text-white z-30 transition-all duration-700 ease-in-out flex flex-col items-center justify-center text-center p-10
          ${isLogin ? 'translate-x-full rounded-l-[120px]' : 'translate-x-0 rounded-r-[120px]'}`}>
          <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-700
            ${isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}`}>
            <h2 className="text-4xl font-extrabold mb-4">Xin chào, Bạn mới!</h2>
            <p className="mb-8 text-blue-50">Đăng ký để sử dụng đầy đủ tính năng của HotelMoonLight.</p>
            <button onClick={() => setIsLogin(false)}
              className="border-2 border-white font-bold py-3 px-12 rounded-full uppercase tracking-wider hover:bg-white hover:text-blue-600 transition">
              ĐĂNG KÝ NGAY
            </button>
          </div>
          <div className={`absolute inset-0 flex flex-col items-center justify-center px-12 transition-all duration-700
            ${!isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20 pointer-events-none'}`}>
            <h2 className="text-4xl font-extrabold mb-4">Mừng trở lại!</h2>
            <p className="mb-8 text-blue-50">Đăng nhập bằng email và mật khẩu của bạn.</p>
            <button onClick={() => setIsLogin(true)}
              className="border-2 border-white font-bold py-3 px-12 rounded-full uppercase tracking-wider hover:bg-white hover:text-blue-600 transition">
              ĐĂNG NHẬP
            </button>
          </div>
        </div>
      </div>

      {/* ══ MODAL: Đăng ký thành công ══════════════════════════════ */}
      {showRegisterSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-teal-500 to-blue-600 px-6 py-8 text-center text-white">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-1">Đăng ký thành công!</h3>
              <p className="text-blue-100 text-sm">Tài khoản của bạn đã được tạo</p>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-600 text-sm font-semibold mb-2">Bước tiếp theo: Hoàn thiện hồ sơ</p>
              <p className="text-gray-400 text-xs mb-4">Để đặt phòng, bạn cần điền thêm thông tin cá nhân. Thông tin này dùng để xác minh danh tính.</p>
              
              <button onClick={handleGoToProfile}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider transition shadow-md">
                Điền thông tin cá nhân →
              </button>
              {/* Đã loại bỏ nút "Bỏ qua" tại đây */}
              <p className="text-red-500 text-xs font-semibold mt-4">Bước này bắt buộc để kích hoạt tài khoản.</p>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: Complete Profile ═════════════════════════════════ */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">

            {profileDone ? (
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="w-10 h-10">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thông tin đã được lưu!</h3>
                <p className="text-gray-500 text-sm mb-2">
                  Hồ sơ của bạn đã hoàn thiện. Vui lòng đăng nhập lại để kích hoạt đầy đủ quyền đặt phòng.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-left">
                  <p className="text-xs text-blue-700 font-semibold">📌 Tại sao cần đăng nhập lại?</p>
                  <p className="text-xs text-blue-600 mt-1">Hệ thống cần cấp lại token với đầy đủ quyền truy cập sau khi xác minh hồ sơ.</p>
                </div>
                <button onClick={handleRelogin}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider transition shadow-md">
                  Đăng nhập & Vào ứng dụng →
                </button>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold">Hoàn thiện hồ sơ</h3>
                      <p className="text-blue-100 text-xs">Bước 2/2 – Thông tin cá nhân <span className="text-yellow-300 font-bold ml-1">(Bắt buộc)</span></p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white/20 rounded-full h-1.5">
                    <div className="bg-white rounded-full h-1.5 w-full"/>
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
                  {profileError && (
                    <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl text-sm">
                      {profileError}
                    </div>
                  )}
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-2">
                    <p className="text-xs text-amber-700 font-semibold">⚠️ Bạn cần điền đầy đủ thông tin này để kích hoạt chức năng hệ thống.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Số điện thoại *
                      </label>
                      <input type="tel" name="soDienThoai" value={profile.soDienThoai}
                        onChange={handleProfileChange} placeholder="0901 234 567" required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Ngày sinh
                      </label>
                      <input type="date" name="ngaySinh" value={profile.ngaySinh}
                        onChange={handleProfileChange} required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Giới tính
                      </label>
                      <select name="gioiTinh" value={profile.gioiTinh} onChange={handleProfileChange} required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition">
                        <option value="">-- Chọn --</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        CCCD / Hộ chiếu *
                      </label>
                      <input type="text" name="cccdPassport" value={profile.cccdPassport}
                        onChange={handleProfileChange} placeholder="024012345678" required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Quốc tịch
                      </label>
                      <input type="text" name="quocTich" value={profile.quocTich}
                        onChange={handleProfileChange} placeholder="Việt Nam" required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Quê quán
                      </label>
                      <input type="text" name="queQuan" value={profile.queQuan}
                        onChange={handleProfileChange} placeholder="Hà Nội" required
                        className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={profileLoading}
                    className="w-full bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider transition mt-4 shadow-md">
                    {profileLoading ? 'ĐANG LƯU VÀO HỆ THỐNG...' : 'LƯU THÔNG TIN & TIẾP TỤC →'}
                  </button>
                  {/* Đã loại bỏ nút "Bỏ qua, đăng nhập sau" tại đây */}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
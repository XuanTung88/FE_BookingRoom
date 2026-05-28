import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStorageItem, clearAuth } from '../utils/storage.util';
import { getRoleFromToken, isAdminRole } from '../utils/jwt.util';
import PhongView from './view/PhongView';
import ServiceView from './view/ServiceView';
import EquipmentView from './view/EquipmentView';

export default function Home() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isScrolled, setIsScrolled] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);

    // Logic chặn ngày quá khứ
    const today = new Date().toISOString().split('T')[0];
    const [checkInDate, setCheckInDate] = useState(today);
    const [checkOutDate, setCheckOutDate] = useState('');

    // SỬ DỤNG UTILS MỚI
    const token = localStorage.getItem('token');
    const user = getStorageItem('user');
    const role = token ? getRoleFromToken(token) : null;
    const isAdmin = isAdminRole(role);

    const slides = [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1920&q=80", // Phòng ngủ
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80", // Bể bơi resort
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80", // Sảnh khách sạn
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1920&q=80", // Nhà hàng
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1920&q=80", // Spa/Massage
        "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1920&q=80", // Vịnh Hạ Long
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1920&q=80", // Biển xanh
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1920&q=80", // Kiến trúc hiện đại
        "https://images.unsplash.com/photo-1478827536114-da961b7f86d2?auto=format&fit=crop&w=1920&q=80"  // View thành phố đêm
    ];


    useEffect(() => {
        const timer = setInterval(() => setCurrentSlide(prev => prev === slides.length - 1 ? 0 : prev + 1), 3000);
        return () => clearInterval(timer);
    }, [slides.length]);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // ĐÃ SỬA: SỬ DỤNG clearAuth() THAY VÌ XÓA THỦ CÔNG
    const handleLogout = () => {
        clearAuth();
        setShowUserMenu(false);
        navigate('/');
    };
    const handleSearchRooms = () => {
        if (!checkInDate || !checkOutDate) {
            alert('Vui lòng chọn ngày nhận và trả phòng!');
            return;
        }
        // Điều hướng kèm Query Params
        navigate(`/booking?checkIn=${checkInDate}&checkOut=${checkOutDate}`);
    };

    const handleScrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 80;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 font-sans">

            {/* HEADER*/}
            <header className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-10">
                        <Link to="/" className={`text-3xl font-extrabold tracking-tight ${isScrolled ? 'text-blue-600' : 'text-white'}`}>
                            Hotel<span className={isScrolled ? 'text-gray-800' : 'text-blue-400'}>MoonLight</span>
                        </Link>
                        <nav className={`hidden md:flex gap-6 font-medium ${isScrolled ? 'text-gray-600' : 'text-gray-100'}`}>
                            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Trang chủ</button>
                            <button type="button" onClick={() => handleScrollToSection('about')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Giới thiệu</button>
                            <button type="button" onClick={() => handleScrollToSection('rooms')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Phòng nghỉ</button>
                            <button type="button" onClick={() => handleScrollToSection('dining')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Ẩm thực</button>
                            <button type="button" onClick={() => handleScrollToSection('events')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Sự kiện</button>
                            <button type="button" onClick={() => handleScrollToSection('services')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Dịch vụ & Tiện nghi</button>
                            <button type="button" onClick={() => handleScrollToSection('location')} className="hover:text-blue-400 transition cursor-pointer bg-transparent border-none font-medium">Vị trí</button>
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        {!user ? (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className={`font-medium transition ${isScrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-300'}`}>Đăng nhập</Link>
                                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">Đăng ký</Link>
                            </div>
                        ) : (
                            <div className="relative">
                                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2 rounded-full text-white hover:bg-white/30 transition shadow-lg" style={{ color: isScrolled ? '#1f2937' : 'white', borderColor: isScrolled ? '#e5e7eb' : '' }}>
                                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <span className="font-medium max-w-[100px] truncate">
                                        {user?.hoTen || 'Tài khoản'}
                                    </span>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 overflow-hidden animate-fade-in-down">
                                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                                            <p className="text-xs text-gray-500">Vai trò</p>
                                            <p className="text-sm font-bold text-blue-600">{role || 'Khách hàng'}</p>
                                        </div>

                                        {/* ĐÃ SỬA: SỬ DỤNG BIẾN isAdmin */}
                                        {isAdmin ? (
                                            <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">💻 Quản trị Hệ thống</Link>
                                        ) : (
                                            <Link to="/booking/history" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">📅 Lịch sử đặt phòng</Link>
                                        )}

                                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium border-t mt-1">🚪 Đăng xuất</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>


            <div className="relative h-screen w-full overflow-hidden bg-gray-900">
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        style={{ backgroundImage: `url(${slide})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70"></div>
                    </div>
                ))}

                {/* Dấu chấm chỉ báo tiến độ slide (Dots indicator) */}
                <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-2 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-8 bg-blue-500' : 'w-2 bg-white/50 hover:bg-white'}`}
                        />
                    ))}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-2xl animate-fade-in-up">
                        Trải nghiệm sự <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Hoàn Mỹ</span>
                    </h1>

                    {/* Thanh Booking Search */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 md:p-6 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-4 w-full max-w-4xl">
                        <div className="flex-1 bg-white rounded-xl p-3 flex flex-col items-start">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nhận phòng</span>
                            <input
                                type="date"
                                min={today}
                                value={checkInDate}
                                onChange={(e) => {
                                    setCheckInDate(e.target.value);
                                    if (checkOutDate < e.target.value) setCheckOutDate('');
                                }}
                                className="w-full outline-none text-gray-800 font-medium mt-1 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-3 flex flex-col items-start">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Trả phòng</span>
                            <input
                                type="date"
                                min={checkInDate || today}
                                value={checkOutDate}
                                onChange={(e) => setCheckOutDate(e.target.value)}
                                className="w-full outline-none text-gray-800 font-medium mt-1 cursor-pointer"
                            />
                        </div>
                        <div className="flex-1 bg-white rounded-xl p-3 flex flex-col items-start">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Khách</span>
                            <select className="w-full outline-none text-gray-800 font-medium mt-1 cursor-pointer bg-transparent">
                                <option>2 Người lớn, 0 Trẻ em</option>
                                <option>1 Người lớn</option>
                            </select>
                        </div>
                        <button
                            onClick={handleSearchRooms}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-8 py-4 transition shadow-lg w-full md:w-auto">
                            TÌM PHÒNG
                        </button>
                    </div>
                </div>
            </div>

            {/* 1. Giới thiệu The MoonLight Da Nang */}
            <div id="about" className="py-24 bg-white relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Cột văn bản */}
                        <div className="lg:w-1/2 space-y-6">
                            <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">
                                CHÀO MỪNG ĐẾN VỚI THE MoonLight DA NANG
                            </span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#00224f] leading-tight">
                                Không Gian Nghỉ Dưỡng <br />
                                <span className="text-[#c9a84c]">Đẳng Cấp 5 Sao</span> Bên Bờ Biển
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Tọa lạc tại vị trí đắc địa trên cung đường biển quyến rũ nhất hành tinh Võ Nguyên Giáp, đối diện với bãi biển Mỹ Khê và Công viên Biển Đông thơ mộng,
                                <strong className="font-bold text-gray-800"> The MoonLight Da Nang</strong> tự hào mang lại không gian lưu trú thượng lưu lý tưởng cho mọi chuyến đi của quý khách.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Khách sạn cao 19 tầng gồm 250 phòng nghỉ hiện đại được trang bị đầy đủ tiện nghi tiêu chuẩn quốc tế, thiết kế tinh tế tối ưu hóa tầm nhìn hướng biển rộng mở.
                                MoonLight là điểm đến tuyệt vời để bạn tận hưởng những phút giây thư giãn trọn vẹn, thưởng thức ẩm thực đỉnh cao và tổ chức sự kiện chuyên nghiệp.
                            </p>
                            <div className="pt-4">
                                <Link to="/booking" className="inline-block bg-[#c9a84c] text-[#00224f] font-extrabold px-8 py-3.5 rounded-full hover:bg-[#b08f3b] transition duration-300 shadow-xl shadow-amber-500/10 uppercase tracking-wider text-sm">
                                    Khám phá phòng ngay
                                </Link>
                            </div>
                        </div>
                        {/* Cột hình ảnh */}
                        <div className="lg:w-1/2 grid grid-cols-12 gap-4 relative">
                            {/* Decorative Frame */}
                            <div className="absolute -inset-4 border border-gray-100 rounded-3xl -z-10 pointer-events-none"></div>

                            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" alt="Lobby Nalod" className="rounded-2xl shadow-xl w-full h-80 object-cover col-span-8 transform hover:scale-105 transition duration-500" />
                            <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80" alt="Hồ bơi vô cực" className="rounded-2xl shadow-xl w-full h-48 object-cover col-span-4 self-end transform hover:scale-105 transition duration-500" />
                            <img src="https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80" alt="Nhà hàng Nalod" className="rounded-2xl shadow-xl w-full h-48 object-cover col-span-4 transform hover:scale-105 transition duration-500" />
                            <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80" alt="Phòng ngủ sang trọng" className="rounded-2xl shadow-xl w-full h-48 object-cover col-span-8 transform hover:scale-105 transition duration-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Những con số biết nói (Nalod in Numbers) */}
            <div className="py-16 bg-[#00224f] text-white relative">
                <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=80')" }}></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                        <div className="space-y-2 p-4 border-r border-white/10 last:border-0">
                            <span className="text-4xl md:text-5xl font-serif font-black text-[#c9a84c] block">5 SAO</span>
                            <span className="text-sm md:text-base font-bold text-gray-300 uppercase tracking-wide">Tiêu chuẩn quốc tế</span>
                        </div>
                        <div className="space-y-2 p-4 border-r border-white/10 last:border-0">
                            <span className="text-4xl md:text-5xl font-serif font-black text-[#c9a84c] block">250+</span>
                            <span className="text-sm md:text-base font-bold text-gray-300 uppercase tracking-wide">Phòng nghỉ hiện đại</span>
                        </div>
                        <div className="space-y-2 p-4 border-r border-white/10 last:border-0">
                            <span className="text-4xl md:text-5xl font-serif font-black text-[#c9a84c] block">10+</span>
                            <span className="text-sm md:text-base font-bold text-gray-300 uppercase tracking-wide">Phòng họp & Sảnh tiệc</span>
                        </div>
                        <div className="space-y-2 p-4 last:border-0">
                            <span className="text-4xl md:text-5xl font-serif font-black text-[#c9a84c] block">300+</span>
                            <span className="text-sm md:text-base font-bold text-gray-300 uppercase tracking-wide">Nhân sự tận tâm</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Hệ thống phòng nghỉ (PhongView) */}
            <div id="rooms" className="py-24 bg-[#f8f9fa]">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">KHÔNG GIAN LƯU TRÚ</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Hệ Thống Phòng Nghỉ Hạng Sang</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                        <p className="text-gray-500">Khám phá nét kiến trúc phóng khoáng, tầm nhìn biển tuyệt đẹp cùng không gian sống lý tưởng kết hợp hoàn hảo giữa công việc và giải trí.</p>
                    </div>
                    <PhongView />
                </div>
            </div>

            {/* 4. Ẩm thực đặc sắc (Dining & Culinary) */}
            <div id="dining" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">TINH HOA ẨM THỰC</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Trải Nghiệm Hương Vị Độc Đáo</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                        <p className="text-gray-500">Thưởng thức hương vị ẩm thực phong phú mang phong cách Á - Âu và những món hải sản tươi ngon đặc trưng vùng biển miền Trung.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 hover:shadow-2xl transition duration-500 group flex flex-col justify-between">
                            <div className="relative h-64 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80" alt="Nhà hàng Ocean" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-[#00224f]">Nhà Hàng Ocean</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Nằm tại tầng 2 hướng nhìn bãi biển tuyệt đẹp, phục vụ buffet sáng đa dạng cùng thực đơn gọi món phong phú với những đầu bếp tay nghề quốc tế hàng đầu.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    <span>Tầng 2 | Sức chứa: 200 khách</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 hover:shadow-2xl transition duration-500 group flex flex-col justify-between">
                            <div className="relative h-64 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80" alt="Cá Chìa Vôi Restaurant" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-[#00224f]">Nhà Hàng Cá Chìa Vôi</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Nơi bạn thưởng thức ẩm thực Việt thuần chất cùng các món hải sản tươi sống đánh bắt trong ngày tại vùng biển Đà Nẵng, chế biến theo công thức độc quyền.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    <span>Tầng 3 | Sức chứa: 150 khách</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100/50 hover:shadow-2xl transition duration-500 group flex flex-col justify-between">
                            <div className="relative h-64 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80" alt="Lobby Lounge" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <h3 className="text-2xl font-bold text-[#00224f]">Lobby Lounge</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Không gian hoàn hảo tại sảnh chính để thưởng thức một tách cà phê buổi sáng thư thả, tiệc trà chiều cao cấp cùng âm nhạc nhẹ nhàng hoặc cocktail khi đêm về.
                                    </p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    <span>Tầng trệt | Sức chứa: 80 khách</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Trung tâm hội nghị & Sự kiện */}
            <div id="events" className="py-24 bg-[#00224f]/5 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Cột hình ảnh sảnh tiệc */}
                        <div className="lg:w-1/2 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-[#c9a84c]/20 to-transparent rounded-3xl -z-10"></div>
                            <img src="https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80" alt="Convention Hall" className="rounded-3xl shadow-2xl w-full h-[450px] object-cover transition duration-700 group-hover:scale-[1.02]" />
                        </div>
                        {/* Cột thông tin giới thiệu sảnh */}
                        <div className="lg:w-1/2 space-y-6">
                            <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">
                                HỘI NGHỊ & SỰ KIỆN CHUYÊN NGHIỆP
                            </span>
                            <h2 className="text-4xl font-serif font-bold text-[#00224f] leading-tight">
                                Trung Tâm Hội Nghị <br />
                                <span className="text-[#c9a84c]">Hàng Đầu</span> Tại Đà Nẵng
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                The MoonLight Da Nang là trung tâm sự kiện hàng đầu chuyên cung cấp không gian hội họp đẳng cấp từ quy mô tiệc cưới, sinh nhật ấm cúng cho tới các hội thảo, hội nghị thượng đỉnh quốc tế quy mô lên tới 500 khách.
                            </p>

                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <span className="text-[#c9a84c] text-xl">✨</span>
                                    <p className="text-gray-700 font-semibold text-sm">Hệ thống 10 phòng họp linh hoạt, trang bị công nghệ cao.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#c9a84c] text-xl">✨</span>
                                    <p className="text-gray-700 font-semibold text-sm">Hệ thống âm thanh ánh sáng, màn hình LED thế hệ mới.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-[#c9a84c] text-xl">✨</span>
                                    <p className="text-gray-700 font-semibold text-sm">Đội ngũ kỹ thuật viên và chuyên viên sự kiện hỗ trợ 24/7.</p>
                                </li>
                            </ul>

                            <div className="pt-4">
                                <Link to="/contact" className="inline-block bg-[#00224f] text-white font-extrabold px-8 py-3.5 rounded-full hover:bg-[#001736] transition duration-300 shadow-xl uppercase tracking-wider text-sm">
                                    Liên hệ đặt sự kiện
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6. Dịch vụ & Tiện ích (Services & Equipment) */}
            <div id="services" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">THƯ GIÃN & TÁI TẠO</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Không Gian Tiện Ích Cao Cấp</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                        <p className="text-gray-500">Tận hưởng hồ bơi vô cực ngoài trời ngắm biển, phòng tập Gym tiện nghi và dịch vụ trị liệu cơ thể cao cấp tại Sen Spa.</p>
                    </div>
                    <ServiceView />
                </div>
            </div>

            {/* Tiện nghi phòng (Equipment & Amenities) */}
            <div className="py-24 bg-[#f8f9fa]">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">TRANG THIẾT BỊ PHÒNG</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Tiện Nghi Đạt Chuẩn 5 Sao</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                        <p className="text-gray-500">Tất cả trang thiết bị đều được chuẩn bị kỹ lưỡng nhằm đem lại cảm giác tự do thoải mái và thư thái tối đa như đang ở chính ngôi nhà của mình.</p>
                    </div>
                    <EquipmentView />
                </div>
            </div>

            {/* 7. Đánh giá của khách hàng (Guest Reviews) */}
            <div className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">Ý KIẾN KHÁCH HÀNG</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Trải Nghiệm Khách Hàng Nói Lên Tất Cả</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Nguyễn Minh Anh", comment: "Khách sạn sạch sẽ, phòng có view biển cực đẹp. Nhân viên phục vụ rất chuyên nghiệp và thân thiện. Kỳ nghỉ thực sự tuyệt vời!", rating: 5 },
                            { name: "Trần Hoàng Nam", comment: "Đồ ăn sáng tại nhà hàng Ocean rất hợp khẩu vị. Hồ bơi vô cực rộng rãi, chụp ảnh sống ảo rất đẹp. Nhất định sẽ quay lại MoonLight.", rating: 5 },
                            { name: "Lê Thị Hương", comment: "Dịch vụ Sen Spa cực kỳ thư giãn. Nhân viên nhiệt tình, hỗ trợ check-in rất nhanh. Một trải nghiệm dịch vụ 5 sao đáng tiền.", rating: 5 },
                        ].map((review, idx) => (
                            <div key={idx} className="bg-[#f8f9fa] p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition duration-300">
                                <div className="flex items-center gap-1 mb-4 text-[#c9a84c] text-lg">
                                    {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
                                </div>
                                <p className="text-gray-600 italic mb-6 leading-relaxed">"{review.comment}"</p>
                                <p className="font-bold text-[#00224f]">— {review.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 8. Vị trí lý tưởng & Bản đồ */}
            <div id="location" className="py-24 bg-[#f8f9fa]">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="text-sm font-extrabold uppercase tracking-widest text-[#c9a84c] block">VỊ TRÍ CHIẾN LƯỢC</span>
                        <h2 className="text-4xl font-serif font-bold text-[#00224f]">Cửa Ngõ Khám Phá Đà Nẵng</h2>
                        <div className="w-16 h-1 bg-[#c9a84c] mx-auto my-4"></div>
                        <p className="text-gray-500">Tọa lạc ngay mặt đường Võ Nguyên Giáp đối diện công viên Biển Đông, cực kỳ thuận lợi để bạn khám phá toàn bộ danh thắng Đà Nẵng.</p>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Bản đồ */}
                        <div className="lg:w-2/3 h-[450px] rounded-3xl overflow-hidden shadow-xl border border-white">
                            <iframe
                                title="Hotel MoonLight Location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.3081737461636!2d108.247654075815!3d16.0498761846875!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3142176aa5f2a52d%3A0x6b3c3c3b3b3b3b3b!2zMTkyIFbDtSBOZ3V5w6puIEdpw6FwLCBBbiBI4bqjaSBOYW0sIFBoxrDhu5tjIE5n4buNYyBIYW5oLCBTxqFuIFRyw6AsIMSQw6AgTuG6tW5nIDU1MDAwMCwgVmlldG5hbQ!5e0!3m2!1svi!2s!4v1713500000000!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="w-full h-full"
                            ></iframe>
                        </div>
                        {/* Thời gian di chuyển */}
                        <div className="lg:w-1/3 bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-[#00224f] mb-6">Kết Nối Không Giới Hạn</h3>
                                <ul className="space-y-5">
                                    <li className="flex items-center gap-4">
                                        <span className="text-[#c9a84c] text-2xl">🏖️</span>
                                        <div>
                                            <p className="font-extrabold text-gray-800 text-sm">Bãi biển Mỹ Khê</p>
                                            <p className="text-xs text-gray-400 font-medium">Đối diện khách sạn (2 phút đi bộ)</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="text-[#c9a84c] text-2xl">🐉</span>
                                        <div>
                                            <p className="font-extrabold text-gray-800 text-sm">Cầu Rồng & Cầu Sông Hàn</p>
                                            <p className="text-xs text-gray-400 font-medium">5 phút đi xe</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="text-[#c9a84c] text-2xl">⛩️</span>
                                        <div>
                                            <p className="font-extrabold text-gray-800 text-sm">Chùa Linh Ứng & Sơn Trà</p>
                                            <p className="text-xs text-gray-400 font-medium">10 phút đi xe</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="text-[#c9a84c] text-2xl">✈️</span>
                                        <div>
                                            <p className="font-extrabold text-gray-800 text-sm">Sân bay Quốc tế Đà Nẵng</p>
                                            <p className="text-xs text-gray-400 font-medium">15 phút đi xe</p>
                                        </div>
                                    </li>
                                    <li className="flex items-center gap-4">
                                        <span className="text-[#c9a84c] text-2xl">🏮</span>
                                        <div>
                                            <p className="font-extrabold text-gray-800 text-sm">Phố cổ Hội An</p>
                                            <p className="text-xs text-gray-400 font-medium">45 phút di chuyển bằng xe</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-2">
                                <span>📍</span> 192 Võ Nguyên Giáp, Quận Sơn Trà, TP. Đà Nẵng, Việt Nam
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MEGA FOOTER */}
            <footer className="bg-[#00224f] text-white pt-20 border-t border-[#c9a84c]/20">
                <div className="container mx-auto px-6 pb-16 border-b border-white/5 text-center">
                    <h2 className="text-3xl font-serif font-light mb-3">Đăng ký nhận ưu đãi độc quyền</h2>
                    <p className="text-gray-300 text-sm mb-8">Trở thành thành viên thân thiết của MoonLight để nhận thông tin khuyến mãi phòng sớm nhất</p>
                    <div className="flex flex-col md:flex-row justify-center max-w-2xl mx-auto gap-2">
                        <input type="email" placeholder="Địa chỉ email của bạn" className="px-5 py-3.5 rounded-full w-full text-gray-900 outline-none focus:ring-2 focus:ring-[#c9a84c] text-sm" />
                        <button className="bg-[#c9a84c] hover:bg-[#b08f3b] text-[#00224f] font-extrabold px-8 py-3.5 rounded-full transition duration-300 uppercase tracking-wider text-sm shadow-lg w-full md:w-auto shrink-0">Đăng ký</button>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-serif font-bold text-[#c9a84c]">THE MoonLight DA NANG</h3>
                        <p className="text-gray-300 text-xs leading-relaxed">
                            Khách sạn & Trung tâm Hội nghị 5 sao quốc tế hàng đầu bên bờ biển Mỹ Khê quyến rũ.
                        </p>
                        <ul className="space-y-4 text-gray-300 text-xs">
                            <li className="flex items-start gap-3"><span>📍</span> 192 Võ Nguyên Giáp, Phường Phước Mỹ, Quận Sơn Trà, TP. Đà Nẵng, Việt Nam</li>
                            <li className="flex items-center gap-3"><span>📞</span> (+84) 236 3913 999</li>
                            <li className="flex items-center gap-3"><span>✉️</span> info@moonlight.com.vn</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-[#c9a84c] mb-6 uppercase tracking-wider text-xs">Về chúng tôi</h3>
                        <ul className="space-y-3 text-gray-300 text-sm">
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Giới thiệu The MoonLight</a></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Tuyển dụng</a></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Tin tức & Sự kiện</a></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Chính sách khách sạn</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-[#c9a84c] mb-6 uppercase tracking-wider text-xs">Dịch vụ chính</h3>
                        <ul className="space-y-3 text-gray-300 text-sm">
                            <li><Link to="/booking" className="hover:text-[#c9a84c] hover:underline transition">Đặt phòng nghỉ dưỡng</Link></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Nhà hàng & Ẩm thực</a></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Hội nghị & Tiệc cưới</a></li>
                            <li><a href="#" className="hover:text-[#c9a84c] hover:underline transition">Trị liệu Sen Spa</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#c9a84c] mb-6 uppercase tracking-wider text-xs">Kết nối với MoonLight</h3>
                            <div className="flex gap-3">
                                <a href="#" className="bg-white/5 p-2.5 rounded-full hover:bg-[#c9a84c] hover:text-[#00224f] transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg></a>
                                <a href="#" className="bg-white/5 p-2.5 rounded-full hover:bg-[#c9a84c] hover:text-[#00224f] transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
                                <a href="#" className="bg-white/5 p-2.5 rounded-full hover:bg-[#c9a84c] hover:text-[#00224f] transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                            <p className="font-bold text-white text-sm">Chính Sách & Quy Định</p>
                            <p>MST: 0401826399</p>
                            <p>Đại diện: Ban Quản lý Khách sạn</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#001b3b] py-6 text-center text-xs text-gray-400 border-t border-white/5">
                    <p>Bản quyền © 2026 The MoonLight Da Nang. Bảo lưu mọi quyền.</p>
                </div>
            </footer>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStorageItem, clearAuth } from '../utils/storage.util';
import { getRoleFromToken, isAdminRole } from '../utils/jwt.util';

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

    const destinations = [
        {
            name: "Vịnh Hạ Long",
            img: "https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            span: "col-span-12 md:col-span-8 row-span-2"
        },
        {
            name: "Sapa",
            img: "https://tse1.mm.bing.net/th/id/OIP.rNJZKOuC3WVUgSxSEP16BgHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
            span: "col-span-6 md:col-span-4"
        },
        {
            name: "Hội An",
            img: "https://tse2.mm.bing.net/th/id/OIP.huPBEEdtrHlfD4HdtkO00QHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
            span: "col-span-6 md:col-span-4"
        },
        {
            name: "Phú Quốc",
            img: "https://tse2.mm.bing.net/th/id/OIP.MjQAAJKlLLdOlutUnQ2-3gHaDX?rs=1&pid=ImgDetMain&o=7&rm=3",
            span: "col-span-12 md:col-span-4"
        },
        {
            name: "Đà Nẵng",
            img: "https://th.bing.com/th/id/OIP.9q1PYB0mUNOnhSt3HUSKwwHaE8?w=277&h=185&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
            span: "col-span-6 md:col-span-4"
        },
        {
            name: "Ninh Bình",
            img: "https://tse3.mm.bing.net/th/id/OIP.h11MmmxQwGY1DgZ7DqSEWAHaE7?rs=1&pid=ImgDetMain&o=7&rm=3",
            span: "col-span-6 md:col-span-4"
        },
        {
            name: "Đà Lạt",
            img: "https://www.agoda.com/wp-content/uploads/2024/09/da-lat-vietnam-featured.jpg",
            span: "col-span-12 md:col-span-12 h-64"
        },
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
                            <Link to="/" className="hover:text-blue-400 transition">Trang chủ</Link>
                            <Link to="/booking" className="hover:text-blue-400 transition">Phòng & Suite</Link>
                            <Link to="/services" className="hover:text-blue-400 transition">Dịch vụ</Link>
                            <Link to="/blog" className="hover:text-blue-400 transition">Blog Du lịch</Link>
                            <Link to="/contact" className="hover:text-blue-400 transition">Liên hệ</Link>
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
                                    <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                        {user?.hoTen?.charAt(0) || 'U'}
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

            {/* Giới thiệu (About Us) */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Cột văn bản */}
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl font-bold text-gray-900 mb-6">Về chúng tôi</h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-6">
                                Sở hữu vị trí độc nhất trên con đường ven biển xinh đẹp của thành phố Đà Nẵng,
                                <strong className="font-semibold"> Hotel MoonLight</strong> có tầm nhìn trực diện hướng ra bãi biển Mỹ Khê –
                                một trong những bãi biển quyến rũ nhất hành tinh và Công viên Biển Đông nổi tiếng.
                                Khách sạn 19 tầng bao gồm 250 phòng lưu trú với thiết kế hiện đại, tiện nghi sẽ là điểm đến lý tưởng cho kỳ nghỉ dưỡng của bạn.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                Tại <strong className="font-semibold">Hotel MoonLight</strong>, bạn sẽ được trải nghiệm một phong cách nghỉ dưỡng hoàn toàn mới mẻ
                                thông qua không gian lưu trú trang nhã cùng trang thiết bị hiện đại, tận hưởng dịch vụ đa dạng.
                            </p>
                            <Link to="/about" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-700 transition shadow-lg">
                                Tìm hiểu thêm
                            </Link>
                        </div>
                        {/* Cột hình ảnh */}
                        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
                            <img src="https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80" alt="Phòng khách sạn" className="rounded-xl shadow-lg w-full h-64 object-cover" />
                            <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80" alt="Hồ bơi" className="rounded-xl shadow-lg w-full h-64 object-cover" />
                            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80" alt="Sảnh" className="rounded-xl shadow-lg w-full h-64 object-cover col-span-2" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hệ thống phòng (Room Types) */}
            <div className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Hệ thống phòng</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Khám phá các hạng phòng được thiết kế tinh tế, kết hợp hài hòa giữa nét kiến trúc hiện đại và tiện nghi đẳng cấp quốc tế.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Premier Ocean Room", area: "32m²", guests: "2 người lớn", img: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80", price: "1.500.000đ" },
                            { name: "Premier City Room", area: "37m²", guests: "2 người lớn", img: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", price: "1.200.000đ" },
                            { name: "Ocean Suite", area: "58m²", guests: "2 người lớn", img: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", price: "3.200.000đ" },
                            { name: "President Suite", area: "90m²", guests: "2 người lớn", img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80", price: "5.500.000đ" },
                        ].map((room, idx) => (
                            <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition group">
                                <div className="relative h-56 overflow-hidden">
                                    <img src={room.img} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-gray-800">Từ {room.price}/đêm</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <span>📏 {room.area}</span>
                                        <span>👤 {room.guests}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">Tận hưởng trải nghiệm lưu trú đẳng cấp và khác biệt với tầm nhìn tuyệt đẹp.</p>
                                    <Link to="/rooms" className="text-blue-600 font-medium hover:text-blue-800 transition flex items-center gap-1">
                                        Xem chi tiết →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* KHÁM PHÁ ĐIỂM ĐẾN */}
            <div className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Khám phá Việt Nam</h2>
                        <p className="text-gray-500">Những điểm đến phổ biến nhất do du khách Hotel Moonlight bình chọn</p>
                    </div>

                    <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
                        {destinations.map((dest, idx) => (
                            <div key={idx} className={`${dest.span} relative rounded-xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all`}>
                                <img src={dest.img} alt={dest.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <h3 className="text-white font-bold text-xl md:text-2xl drop-shadow-md">{dest.name}</h3>
                                    <p className="text-gray-200 text-sm font-medium opacity-0 group-hover:opacity-100 transition duration-300">Khám phá ngay &rarr;</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Dịch vụ & Tiện ích (Services & Amenities) */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Không gian thư giãn & tái tạo năng lượng</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Trải nghiệm các dịch vụ đẳng cấp tại Hotel MoonLight</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { name: "Sen Spa", desc: "Chăm sóc sức khỏe và làm đẹp với các liệu trình chuyên nghiệp.", icon: "💆", img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80" },
                            { name: "Hồ bơi ngoài trời", desc: "Ngả lưng về biển, hướng góc nhìn toàn cảnh thành phố.", icon: "🏊", img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80" },
                            { name: "Phòng Gym", desc: "Trang thiết bị hiện đại, vừa vận động vừa ngắm nhìn thành phố.", icon: "💪", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80" },
                            { name: "Quầy lưu niệm", desc: "Mang một phần của Đà Nẵng theo bạn trở về.", icon: "🎁", img: "https://tse4.mm.bing.net/th/id/OIP.8who6h6c1A0TnVhZXxWz6QHaE8?rs=1&pid=ImgDetMain&o=7&rm=3" },
                        ].map((service, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition group">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={service.img} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute bottom-3 left-3 text-white">
                                        <span className="text-2xl mr-2">{service.icon}</span>
                                        <h3 className="text-xl font-bold">{service.name}</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <p className="text-gray-600 text-sm">{service.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>



            {/* Đánh giá của khách hàng (Guest Reviews) */}
            <div className="py-20 bg-blue-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Khách hàng nói gì về chúng tôi</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Những trải nghiệm thực tế từ du khách đã nghỉ dưỡng tại Hotel MoonLight</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Nguyễn Minh Anh", comment: "Phòng sạch sẽ, view biển cực đẹp. Nhân viên thân thiện và chu đáo. Chắc chắn sẽ quay lại!", rating: 5 },
                            { name: "Trần Hoàng Nam", comment: "Khách sạn có buffet sáng đa dạng món, ăn khá hợp khẩu vị. Dịch vụ spa và hồ bơi tuyệt vời.", rating: 5 },
                            { name: "Lê Thị Hương", comment: "Khách sạn còn tặng set bánh tạm biệt nữa, 100 điểm chu đáo. Mọi người nên tới trải nghiệm.", rating: 5 },
                        ].map((review, idx) => (
                            <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg">
                                <div className="flex items-center gap-1 mb-3 text-yellow-400">
                                    {[...Array(review.rating)].map((_, i) => <span key={i}>★</span>)}
                                </div>
                                <p className="text-gray-600 italic mb-4">"{review.comment}"</p>
                                <p className="font-semibold text-gray-900">— {review.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tin tức & Sự kiện (News & Events) */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Tin tức Du lịch</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Cập nhật những thông tin mới nhất về du lịch và sự kiện tại Hotel MoonLight</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Địa điểm lý tưởng cho sự kiện MICE tại thành phố biển Đà Nẵng", img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=800&q=80", date: "10/04/2026" },
                            { title: "Du lịch Đà Nẵng - sự kết hợp hoàn hảo: khám phá và vận động", img: "https://blogyeuphuot.com/wp-content/uploads/2017/04/Dia-diem-du-lich-noi-tieng-o-Da-Nang.jpg", date: "05/04/2026" },
                            { title: "Top 5 hoạt động dành cho cặp đôi khi du lịch Hạ Long", img: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80", date: "01/04/2026" },
                        ].map((news, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition group cursor-pointer">
                                <div className="relative h-48 overflow-hidden">
                                    <img src={news.img} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                    <div className="absolute bottom-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">{news.date}</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{news.title}</h3>
                                    <Link to="/blog" className="text-blue-600 font-medium hover:text-blue-800 transition flex items-center gap-1">
                                        Đọc thêm →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Vị trí lý tưởng & Bản đồ */}
            <div className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">Vị trí lý tưởng</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">Khách sạn tọa lạc ngay trung tâm thành phố biển, thuận tiện di chuyển đến các danh thắng nổi tiếng</p>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Bản đồ */}
                        <div className="lg:w-2/3 h-96 rounded-2xl overflow-hidden shadow-lg">
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
                        <div className="lg:w-1/3 bg-gray-50 p-8 rounded-2xl shadow-md">
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Khám phá không giới hạn</h3>
                            <ul className="space-y-6">
                                <li className="flex items-center gap-4">
                                    <span className="text-blue-600 text-2xl">🏖️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Biển Mỹ Khê</p>
                                        <p className="text-sm text-gray-500">2 phút đi bộ</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="text-blue-600 text-2xl">🐉</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Cầu Rồng</p>
                                        <p className="text-sm text-gray-500">5 phút đi xe</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="text-blue-600 text-2xl">⛩️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Chùa Linh Ứng</p>
                                        <p className="text-sm text-gray-500">10 phút đi xe</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="text-blue-600 text-2xl">✈️</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Sân bay Quốc tế Đà Nẵng</p>
                                        <p className="text-sm text-gray-500">15 phút đi xe</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <span className="text-blue-600 text-2xl">🏮</span>
                                    <div>
                                        <p className="font-semibold text-gray-800">Phố cổ Hội An</p>
                                        <p className="text-sm text-gray-500">45 phút đi xe</p>
                                    </div>
                                </li>
                            </ul>
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <p className="text-gray-600 flex items-center gap-2">
                                    <span>📍</span> 192 Võ Nguyên Giáp, An Hải, Đà Nẵng, Việt Nam
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MEGA FOOTER */}
            <footer className="bg-[#00224f] text-white pt-16">
                <div className="container mx-auto px-6 pb-12 border-b border-blue-800 text-center">
                    <h2 className="text-2xl font-light mb-2">Tiết kiệm thời gian và tiền bạc!</h2>
                    <p className="text-gray-300 mb-6">Đăng ký nhận bản tin và chúng tôi sẽ gửi những ưu đãi tốt nhất cho bạn</p>
                    <div className="flex flex-col md:flex-row justify-center max-w-2xl mx-auto gap-2">
                        <input type="email" placeholder="Địa chỉ email của bạn" className="px-4 py-3 rounded-md w-full text-gray-900 outline-none" />
                        <button className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-md font-bold transition">Đăng ký</button>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-6">Hotel MoonLight</h3>
                        <ul className="space-y-4 text-gray-300 text-sm">
                            <li className="flex items-start gap-3"><span>📍</span> 123 Đường Bờ Biển, Phường Cẩm An, TP Hội An, Việt Nam</li>
                            <li className="flex items-center gap-3"><span>📞</span> +84 236 123 4567</li>
                            <li className="flex items-center gap-3"><span>✉️</span> contact@hotelmoonlight.vn</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-6">Về chúng tôi</h3>
                        <ul className="space-y-3 text-gray-300 text-sm">
                            <li><a href="#" className="hover:text-white hover:underline">Giới thiệu HotelMoonLight</a></li>
                            <li><a href="#" className="hover:text-white hover:underline">Tuyển dụng</a></li>
                            <li><a href="#" className="hover:text-white hover:underline">Tin tức & Blog</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-6">Hỗ trợ khách hàng</h3>
                        <ul className="space-y-3 text-gray-300 text-sm">
                            <li><a href="#" className="hover:text-white hover:underline">Trợ giúp & Liên hệ</a></li>
                            <li><a href="#" className="hover:text-white hover:underline">Chính sách bảo mật</a></li>
                            <li><a href="#" className="hover:text-white hover:underline">Điều khoản sử dụng</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-6">Kết nối với chúng tôi</h3>
                        <div className="flex gap-4 mb-6">
                            <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-blue-600 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg></a>
                            <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-pink-600 transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg></a>
                            <a href="#" className="bg-white/10 p-2 rounded-full hover:bg-black transition"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
                        </div>
                        <h3 className="text-lg font-bold mb-4">Đối tác thanh toán</h3>
                        <div className="flex gap-2">
                            <div className="bg-white px-2 py-1 rounded text-blue-800 font-bold text-xs">VISA</div>
                            <div className="bg-white px-2 py-1 rounded text-red-600 font-bold text-xs">MasterCard</div>
                            <div className="bg-white px-2 py-1 rounded text-sky-500 font-bold text-xs italic">PayPal</div>
                        </div>
                    </div>
                </div>

                <div className="bg-[#001736] py-4 text-center text-sm text-gray-400">
                    <p>Bản quyền © 2026 HotelMoonLight. Bảo lưu mọi quyền.</p>
                </div>
            </footer>
        </div>
    );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { roomTypeService } from '../../services/roomType.service';

export default function PhongView() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const defaultRoomImages = [
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80"
    ];

    useEffect(() => {
        const fetchRoomTypes = async () => {
            try {
                const response = await roomTypeService.getAll();
                setRoomTypes(response.data || []);
            } catch (error) {
                console.error("Error fetching room types:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoomTypes();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 animate-pulse">
                        <div className="h-64 bg-gray-200"></div>
                        <div className="p-6 space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-10 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (roomTypes.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <span className="text-4xl block mb-3">🛏️</span>
                <p className="font-medium text-lg text-gray-700">Hiện tại chưa có thông tin hạng phòng nào.</p>
                <p className="text-sm text-gray-400 mt-1">Vui lòng quay lại sau hoặc liên hệ bộ phận hỗ trợ.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roomTypes.slice(0, 4).map((room, idx) => {
                const roomImg = room.anhDaiDien || defaultRoomImages[idx % defaultRoomImages.length];
                return (
                    <div 
                        key={room.id || idx} 
                        className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-500 transform hover:-translate-y-2 group border border-gray-100/50 flex flex-col justify-between"
                    >
                        <div className="relative h-64 overflow-hidden">
                            <img 
                                src={roomImg} 
                                alt={room.tenLoaiPhong} 
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"></div>
                            
                            {/* Giá phòng */}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-2xl text-sm font-extrabold text-gray-900 shadow-lg border border-white/20">
                                Từ {formatPrice(room.giaCoBan)}
                            </div>

                            {/* Badge Loại phòng */}
                            <div className="absolute bottom-4 left-4 text-white">
                                <span className="text-xs font-bold uppercase tracking-wider bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-md mb-1.5 inline-block">
                                    HẠNG SANG
                                </span>
                                <h3 className="text-xl font-extrabold text-white drop-shadow-md">{room.tenLoaiPhong}</h3>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <div className="space-y-3">
                                {/* Tiện ích cơ bản */}
                                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 w-fit">
                                    <span className="flex items-center gap-1.5">👤 Tối đa {room.soNguoiToiDa} khách</span>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                    {room.moTa || "Tận hưởng không gian lưu trú sang trọng đẳng cấp với trang thiết bị tiện nghi cao cấp đạt tiêu chuẩn 5 sao."}
                                </p>
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                                <Link 
                                    to="/booking" 
                                    className="text-blue-600 font-extrabold hover:text-blue-800 transition duration-300 flex items-center gap-1.5 text-sm"
                                >
                                    Xem chi tiết phòng &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

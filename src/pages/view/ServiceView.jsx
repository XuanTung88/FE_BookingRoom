import { useState, useEffect } from 'react';
import { serviceService } from '../../services/service.service';

export default function ServiceView() {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const categoryImages = {
        "Ẩm thực": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80",
        "Spa & Làm đẹp": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
        "Giặt là": "https://th.bing.com/th/id/OIP.RvEVsseAwO-QPjb3A3QqGQHaE8?w=243&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3",
        "Thể thao": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
        "Vận chuyển": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80",
        "Giải trí": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
        "Phòng": "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
    };

    const defaultServiceImage = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

    const categoryIcons = {
        "Ẩm thực": "🍽️",
        "Spa & Làm đẹp": "💆",
        "Giặt là": "👕",
        "Thể thao": "🏋️",
        "Vận chuyển": "🚗",
        "Tiện ích": "🔧",
        "Giải trí": "🎮",
        "Phòng": "🛏️"
    };

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await serviceService.getAll();
                // Chỉ lấy dịch vụ có trạng thái 'Hoạt động'
                const activeServices = (response.data || []).filter(svc => svc.trangThai === 'Hoạt động');
                setServices(activeServices);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, idx) => (
                    <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 animate-pulse">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-6 space-y-4">
                            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                <span className="text-4xl block mb-3">💆</span>
                <p className="font-medium text-lg text-gray-700">Hiện tại chưa có dịch vụ nào khả dụng.</p>
                <p className="text-sm text-gray-400 mt-1">Chúng tôi sẽ cập nhật sớm các tiện ích mới.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.slice(0, 4).map((svc, idx) => {
                const image = categoryImages[svc.loaiDichVu] || defaultServiceImage;
                const icon = categoryIcons[svc.loaiDichVu] || "⭐";
                return (
                    <div
                        key={svc.id || svc.maDichVu || idx}
                        className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition duration-500 group border border-gray-100/50 flex flex-col justify-between"
                    >
                        <div className="relative h-48 overflow-hidden">
                            <img
                                src={image}
                                alt={svc.tenDichVu}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                            <div className="absolute bottom-4 left-4 text-white flex items-center gap-2">
                                <span className="text-2xl bg-white/20 backdrop-blur-md w-10 h-10 rounded-xl flex items-center justify-center border border-white/20">
                                    {icon}
                                </span>
                                <div>
                                    <span className="text-[10px] font-bold tracking-wider bg-amber-500/90 text-white px-2 py-0.5 rounded-full block w-fit mb-0.5 uppercase">
                                        {svc.loaiDichVu}
                                    </span>
                                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{svc.tenDichVu}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between">
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                {svc.moTa || "Trải nghiệm tiện ích cao cấp được phục vụ bởi đội ngũ chuyên nghiệp, mang đến cho quý khách sự thư giãn tối đa."}
                            </p>

                            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500">Mức giá:</span>
                                <span className="font-extrabold text-blue-600 text-base">{formatPrice(svc.gia)}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

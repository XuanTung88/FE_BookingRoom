import { useState, useEffect } from 'react';
import { equipmentService } from '../../services/equipment.service';

export default function EquipmentView() {
    const [equipments, setEquipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Thư viện mô tả và icon cho các thiết bị phòng
    const equipmentCatalog = {
        tv: {
            title: "Smart TV 4K",
            desc: "Màn hình 55 inch UHD siêu nét tích hợp Netflix, Youtube giải trí không giới hạn.",
            icon: (
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 18M3 6L21 6M21 6V15C21 16.1046 20.1046 17 19 17H5C3.89543 17 3 16.1046 3 15V6M10 21H14" />
                </svg>
            )
        },
        tủ_lạnh: {
            title: "Mini Bar & Tủ lạnh",
            desc: "Tủ lạnh mini lưu trữ nước giải khát, rượu vang và đồ ăn nhẹ mát lạnh.",
            icon: (
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V9M12 3V21M12 3H17C18.1046 3 19 3.89543 19 5V9M19 9H12M8.5 7.5H9.5M14.5 12H15.5" />
                </svg>
            )
        },
        điều_hòa: {
            title: "Điều Hòa 2 Chiều",
            desc: "Hệ thống điều hòa trung tâm Inverter duy trì nhiệt độ phòng lý tưởng.",
            icon: (
                <svg className="w-8 h-8 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V16M20 8V16M8 8V16M16 8V16M12 8V16M4 12H20M3 4H21M3 20H21" />
                </svg>
            )
        },
        máy_sấy: {
            title: "Máy Sấy Tóc Ion",
            desc: "Máy sấy công suất lớn với công nghệ tạo ion giúp bảo vệ tóc luôn mềm mượt.",
            icon: (
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7C4.547 9.547 4.5 10.768 4.5 12s.047 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.092-1.209.138-2.43.138-3.662zM9 12h6M12 9v6" />
                </svg>
            )
        },
        két_sắt: {
            title: "Két Sắt Điện Tử",
            desc: "Đảm bảo an toàn tuyệt đối cho tài sản và tài liệu quan trọng của quý khách.",
            icon: (
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            )
        },
        ấm_đun: {
            title: "Ấm Siêu Tốc & Trà",
            desc: "Ấm đun nước cao cấp đi kèm khay trà và cà phê miễn phí phục vụ hàng ngày.",
            icon: (
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v11.792a3.75 3.75 0 11-7.5 0V3.104a3.75 3.75 0 017.5 0zm11.752 4.417c0-2.025-1.583-3.698-3.606-3.766a4.113 4.113 0 00-4.148 4.11v1.171c0 1.258.468 2.47 1.32 3.393l2.84 3.08a4.119 4.119 0 006.185-5.698l-2.591-2.29z" />
                </svg>
            )
        },
        wifi: {
            title: "Wifi Tốc Độ Cao",
            desc: "Kết nối băng thông rộng không giới hạn phủ sóng mọi ngóc ngách trong phòng.",
            icon: (
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856a9.75 9.75 0 0113.788 0M1.924 8.674a14.25 14.25 0 0120.152 0M12.53 18.22a1.5 1.5 0 11-1.06-1.06 1.5 1.5 0 011.06 1.06z" />
                </svg>
            )
        }
    };

    const defaultCatalogItem = {
        title: "Thiết Bị Tiện Nghi",
        desc: "Được kiểm tra và bảo dưỡng định kỳ để đảm bảo sự tiện lợi tối đa cho quý khách.",
        icon: (
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
        )
    };

    const mapEquipmentToCatalog = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes("tv") || lowerName.includes("tivi") || lowerName.includes("television")) return equipmentCatalog.tv;
        if (lowerName.includes("lạnh") || lowerName.includes("tủ") || lowerName.includes("bar") || lowerName.includes("fridge")) return equipmentCatalog.tủ_lạnh;
        if (lowerName.includes("hòa") || lowerName.includes("lạnh") || lowerName.includes("ac") || lowerName.includes("conditioner")) return equipmentCatalog.điều_hòa;
        if (lowerName.includes("sấy") || lowerName.includes("hair")) return equipmentCatalog.máy_sấy;
        if (lowerName.includes("két") || lowerName.includes("sắt") || lowerName.includes("safe")) return equipmentCatalog.két_sắt;
        if (lowerName.includes("ấm") || lowerName.includes("đun") || lowerName.includes("kettle")) return equipmentCatalog.ấm_đun;
        if (lowerName.includes("wifi") || lowerName.includes("internet")) return equipmentCatalog.wifi;

        return {
            title: name,
            desc: defaultCatalogItem.desc,
            icon: defaultCatalogItem.icon
        };
    };

    useEffect(() => {
        const fetchEquipments = async () => {
            try {
                const response = await equipmentService.getAll();
                // Loại bỏ trùng tên để hiển thị giới thiệu danh mục thiết bị đẹp mắt
                const uniqueEquipments = [];
                const seenNames = new Set();
                (response.data || []).forEach(item => {
                    const normalized = item.tenThietBi?.trim();
                    if (normalized && !seenNames.has(normalized)) {
                        seenNames.add(normalized);
                        uniqueEquipments.push(item);
                    }
                });

                // Nếu API trả về quá ít, bổ sung các thiết bị mặc định để giao diện phong phú
                if (uniqueEquipments.length < 3) {
                    const fallbackList = [
                        { id: "1", tenThietBi: "Smart TV 4K" },
                        { id: "2", tenThietBi: "Tủ lạnh Mini Bar" },
                        { id: "3", tenThietBi: "Điều hòa 2 Chiều" },
                        { id: "4", tenThietBi: "Wifi Tốc Độ Cao" },
                        { id: "5", tenThietBi: "Két sắt điện tử" }
                    ];
                    setEquipments(fallbackList);
                } else {
                    setEquipments(uniqueEquipments);
                }
            } catch (error) {
                console.error("Error fetching equipments:", error);
                // Fallback dữ liệu tĩnh khi lỗi kết nối
                const fallbackList = [
                    { id: "1", tenThietBi: "Smart TV 4K" },
                    { id: "2", tenThietBi: "Tủ lạnh Mini Bar" },
                    { id: "3", tenThietBi: "Điều hòa 2 Chiều" },
                    { id: "4", tenThietBi: "Wifi Tốc Độ Cao" },
                    { id: "5", tenThietBi: "Két sắt điện tử" }
                ];
                setEquipments(fallbackList);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEquipments();
    }, []);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-gray-100 animate-pulse flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-3">
                            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipments.slice(0, 8).map((equip, idx) => {
                const catalogItem = mapEquipmentToCatalog(equip.tenThietBi);
                return (
                    <div
                        key={equip.id || idx}
                        className="bg-white rounded-2xl p-6 border border-gray-100/70 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition duration-500 flex items-start gap-4 transform hover:-translate-y-1 group"
                    >
                        <div className="w-14 h-14 bg-gray-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center border border-gray-100 transition duration-500 shrink-0 shadow-sm">
                            {catalogItem.icon}
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 text-base mb-1.5 transition duration-300 group-hover:text-blue-600">
                                {catalogItem.title}
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                {catalogItem.desc}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

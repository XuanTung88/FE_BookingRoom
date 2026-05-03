// src/components/UI/QuickStatusCards.jsx

// 1. Thêm { onShowCheckinList } vào đây để nhận hàm từ AdminDashboard truyền xuống
export default function QuickStatusCards({ onShowCheckinList }) {
    return (
        <div className="grid grid-cols-3 gap-6 mt-6 shrink-0">
            {/* Card 1: Quá hạn */}
            <div className="bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">! Quá hạn trả phòng</span>
                    <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">QUÁ HẠN</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Phòng 102</h4>
                <p className="text-xs text-gray-600">Khách: Lê Hồng Đăng<br/>Dự kiến trả: 12:00 PM hôm qua</p>
            </div>

            {/* Card 2: Check-in mới (ĐÃ ĐƯỢC SỬA) */}
            <div 
                onClick={onShowCheckinList} // 2. Gắn sự kiện click vào đây
                className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex flex-col justify-between cursor-pointer hover:shadow-md hover:border-blue-300 transition active:scale-95" // 3. Thêm cursor-pointer và hiệu ứng hover
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">&rarr; Check-in mới</span>
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">MỚI</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Trần Thế Vinh vừa tới sảnh</h4>
                <p className="text-xs text-gray-600">Phòng 101 • 2 phút trước</p>
            </div>

            {/* Card 3: Dọn dẹp xong */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">🧹 Dọn dẹp hoàn tất</span>
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">XONG</span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">Phòng 202</h4>
                <p className="text-xs text-gray-600">Đã sẵn sàng đón khách.</p>
            </div>
        </div>
    );
}
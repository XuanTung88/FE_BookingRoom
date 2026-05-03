export default function CheckinListModal({ isOpen, onClose, checkins, rooms, onProcessCheckin }) {
    if (!isOpen) return null;

    return (
        <>
            {/* Lớp phủ đen làm mờ nền */}
            <div className="fixed inset-0 bg-black/40 z-[100]" onClick={onClose}></div>
            
            {/* Modal panel chính */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl w-[650px] max-h-[85vh] overflow-hidden z-[101] flex flex-col">
                
                {/* Header modal */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h.01M12 12h.01M15 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Danh sách các phòng chuẩn bị check-in</h3>
                            <p className="text-sm text-gray-500 mt-1">Dự kiến hôm nay, ngày {new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition p-2.5 hover:bg-gray-100 rounded-full">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Nội dung danh sách */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {checkins.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl bg-white">
                            Không có phòng nào dự kiến check-in trong ngày hôm nay.
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-inner">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th scope="col" className="px-5 py-3.5">Phòng / Loại</th>
                                        <th scope="col" className="px-5 py-3.5">Tên Khách</th>
                                        <th scope="col" className="px-5 py-3.5 text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checkins.map((item, index) => {
                                        return (
                                            <tr key={index} className="bg-white border-b border-gray-100 last:border-0 hover:bg-blue-50/50 transition">
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-gray-900 text-base">{item.soPhong}</div>
                                                    <div className="text-blue-500 font-medium text-xs uppercase mt-0.5">{item.loai}</div>
                                                </td>
                                                <td className="px-5 py-4 text-gray-800 font-medium">{item.guestName}</td>
                                                <td className="px-5 py-4 text-center">
                                                    {/* Nhấn vào đây sẽ gọi hàm xử lý mở Drawer */}
                                                    <button 
                                                        onClick={() => onProcessCheckin(item)}
                                                        className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow"
                                                    >
                                                        Check-in ngay
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer modal */}
                <div className="p-6 bg-white border-t border-gray-100 flex justify-end shrink-0">
                    <button onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-semibold py-2.5 px-6 rounded-xl text-sm transition">
                        Đóng
                    </button>
                </div>
            </div>
        </>
    );
}
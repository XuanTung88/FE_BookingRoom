// src/components/UI/CalendarHeader.jsx
import { forwardRef } from 'react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from 'date-fns/locale/vi'; 

// Import tiếng Việt cho lịch
registerLocale('vi', vi);

const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
    <button 
        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 w-32 hover:bg-gray-50 transition outline-none"
        onClick={onClick} 
        ref={ref}
    >
        <span>{value}</span>
        <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
    </button>
));

CustomDateInput.displayName = 'CustomDateInput';

export default function CalendarHeader({ 
    currentDate, 
    setCurrentDate, 
    selectedFloor, 
    setSelectedFloor,
    // Props mới từ AdminDashboard để điều hướng tuần và mở modal
    prevWeek,
    nextWeek,
    startOfWeek,
    endOfWeek,
    goToday,
    formatDay,
    onShowCheckinList, // Hàm callback mở modal danh sách check-in ngày
    floors = []
}) {
    return (
        <div className="flex flex-col gap-4 mb-6 shrink-0">
            {/* Hàng trên: Công cụ lọc & Chọn ngày & Modal trigger */}
            <div className="flex justify-between items-center gap-4">
                {/* BỘ LỌC TẦNG Ở TRÁI - THANH TÌM KIẾM CŨ ĐÃ BỊ XÓA */}
                <div className="flex gap-4">
                    {/* Bộ lọc Tầng */}
                    <select 
            value={selectedFloor} 
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 outline-none focus:border-blue-500 bg-white"
        >
            <option value="">Tất cả các tầng</option>
            {floors.map(f => (
                <option key={f} value={f}>Tầng {f}</option>
            ))}
        </select>
                </div>

                {/* ĐIỀU HƯỚNG TUẦN VÀ MỞ MODAL Ở GIỮA */}
                <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-1 gap-1">
                    {/* Nút lùi tuần */}
                    <button onClick={prevWeek} title="Tuần trước" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition h-[36px]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    
                    {/* NÚT TUẦN ĐỂ MỞ MODAL (NHẤN VÀO ĐÂY ĐỂ HIỂN THỊ FORM CHECK-IN TRONG NGÀY) */}
                    <button 
                        onClick={onShowCheckinList} // Gắn sự kiện gọi API mở modal
                        className="px-4 font-semibold text-sm text-blue-600 hover:bg-blue-50 rounded-md py-1.5 transition flex items-center gap-1.5 h-[36px]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h.01M12 12h.01M15 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        Tuần này: {formatDay(startOfWeek)} - {formatDay(endOfWeek)}
                    </button>
                    
                    {/* Nút tiến tuần */}
                    <button onClick={nextWeek} title="Tuần sau" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition h-[36px]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>

                {/* BỘ CHỌN NGÀY VÀ NÚT HIỆN TẠI Ở PHẢI */}
                <div className="flex items-center gap-3">
                    {/* Bộ chọn ngày từ thư viện react-datepicker */}
                    <div className="flex items-center border border-gray-300 bg-white rounded-md overflow-hidden h-[38px]">
                        <DatePicker 
                            selected={currentDate} 
                            onChange={(date) => setCurrentDate(date)} 
                            dateFormat="dd/MM/yyyy"
                            locale="vi"
                            customInput={<CustomDateInput />}
                            showPopperArrow={false}
                        />
                    </div>
                    
                    {/* Nút Hiện tại (vẫn giữ logic ban đầu: goToday) */}
                    <button 
                        onClick={goToday} 
                        className="bg-[#1DA1F2] hover:bg-blue-500 text-white px-4 text-sm font-medium rounded-md flex items-center gap-2 transition h-[38px]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Hiện tại
                    </button>
                </div>
            </div>

            {/* Hàng dưới: Chú thích màu sắc */}
            <div className="flex gap-6 items-center text-xs font-medium text-gray-600 bg-white p-3 rounded-md border border-gray-200">
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Chuẩn bị Check-in</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600"></span> Đang ở</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Quá hạn trả phòng</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-400"></span> Đã Check-out</span>
            </div>
        </div>
    );
}
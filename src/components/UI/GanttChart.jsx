export default function GanttChart({ currentDate, rooms, bookings, onSelectBooking }) {
    const getWeekDays = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
        const monday = new Date(d.setDate(diff));
        
        const week = [];
        for (let i = 0; i < 7; i++) {
            const nextDay = new Date(monday);
            nextDay.setDate(monday.getDate() + i);
            week.push(nextDay);
        }
        return week;
    };

    const weekDays = getWeekDays(currentDate);
    const startOfWeek = weekDays[0];
    const endOfWeek = weekDays[6];

    const formatDay = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const getBookingStyle = (booking) => {
        const bCheckIn = new Date(booking.checkIn);
        const bCheckOut = new Date(booking.checkOut);

        if (bCheckOut.getHours() < 12) {
            bCheckOut.setDate(bCheckOut.getDate() - 1);
        }

        const bStart = bCheckIn.setHours(0,0,0,0);
        const bEnd = bCheckOut.setHours(0,0,0,0);
        const wStart = new Date(startOfWeek).setHours(0,0,0,0);
        const wEnd = new Date(endOfWeek).setHours(0,0,0,0);

        if (bEnd < wStart || bStart > wEnd) return { display: 'none' };

        const visibleStart = Math.max(wStart, bStart);
        const visibleEnd = Math.min(wEnd, bEnd);

        const msPerDay = 1000 * 60 * 60 * 24;
        const startDayIndex = Math.round((visibleStart - wStart) / msPerDay);
        const durationDays = Math.round((visibleEnd - visibleStart) / msPerDay) + 1;

        return {
            left: `${(startDayIndex / 7) * 100}%`,
            width: `${(durationDays / 7) * 100}%`,
        };
    };

    const floors = [...new Set(rooms.map(r => r.tang))].sort((a, b) => a - b);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="w-40 p-4 border-r border-gray-200 flex items-center text-xs font-bold text-gray-500 uppercase">
                    Phòng / Tầng
                </div>
                <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((day, idx) => (
                        <div key={idx} className="p-3 text-center border-r border-gray-100 last:border-r-0">
                            <p className="text-xs font-bold text-gray-400 uppercase">Thứ {idx === 6 ? 'CN' : idx + 2}</p>
                            <p className={`text-lg font-bold mt-0.5 ${day.toDateString() === new Date().toDateString() ? 'text-red-500' : 'text-gray-800'}`}>
                                {formatDay(day)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {floors.map(tang => {
                    const roomsInFloor = rooms.filter(r => r.tang === tang);
                    if (roomsInFloor.length === 0) return null;

                    return (
                        <div key={`floor-${tang}`}>
                            <div className="bg-gray-100 px-4 py-2 text-xs font-bold text-gray-500">TẦNG {tang}</div>
                            
                            {roomsInFloor.map(room => (
                                <div key={room.id} className="flex border-b border-gray-100 min-h-[80px] group hover:bg-gray-50 transition">
                                    <div className="w-40 p-4 border-r border-gray-100 flex flex-col justify-center shrink-0">
                                        <h4 className="font-bold text-gray-900">{room.soPhong}</h4>
                                        <span className="text-[10px] font-bold text-blue-500 uppercase mt-1 truncate" title={room.loai}>{room.loai}</span>
                                    </div>

                                    <div className="flex-1 relative border-r border-gray-50 last:border-r-0">
                                        <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                            {[...Array(7)].map((_, i) => <div key={i} className="border-r border-gray-50 last:border-r-0 h-full"></div>)}
                                        </div>

                                        {bookings.filter(b => b.roomId === room.id).map(booking => {
                                            const styleProps = getBookingStyle(booking);
                                            if (styleProps.display === 'none') return null;

                                            return (
                                                <div key={booking.id} 
                                                    className="absolute top-1/2 -translate-y-1/2 h-12 p-1 z-10 cursor-pointer"
                                                    style={styleProps}
                                                    onClick={() => onSelectBooking(booking)}
                                                >
                                                    <div className={`${booking.color} w-full h-full rounded-full shadow-md text-white flex items-center px-4 overflow-hidden hover:brightness-110 transition`}>
                                                        <svg className="w-4 h-4 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                        <span className="text-xs font-semibold truncate">{booking.guestName} • {booking.status}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
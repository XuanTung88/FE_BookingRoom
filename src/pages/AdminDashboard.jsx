import { useState, useEffect } from 'react';
import AdminLayout from '../components/Layout/AdminLayout';
import CalendarHeader from '../components/UI/CalendarHeader';
import GanttChart from '../components/UI/GanttChart'; 
import BookingDrawer from '../components/UI/BookingDrawer';
import QuickStatusCards from '../components/UI/QuickStatusCards'; 
import CheckinListModal from '../components/UI/CheckinListModal'; 
import { fetchDashboardData, fetchDailyCheckins } from '../api/bookingService'; 

export default function AdminDashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedFloor, setSelectedFloor] = useState(''); 
    
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('info');

    const [isShowCheckinModal, setIsShowCheckinModal] = useState(false);
    const [dailyCheckins, setDailyCheckins] = useState([]);
    const [openCheckinFormDirectly, setOpenCheckinFormDirectly] = useState(false);

    const getWeekBoundaries = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(d.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return { startOfWeek, endOfWeek };
    };

    const { startOfWeek, endOfWeek } = getWeekBoundaries(currentDate);

    const formatForAPI = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const loadGanttData = async () => {
        const startDateStr = formatForAPI(startOfWeek);
        const endDateStr = formatForAPI(endOfWeek);
        
        try {
            const data = await fetchDashboardData(startDateStr, endDateStr, selectedFloor);
            setRooms(data.rooms);
            setBookings(data.bookings);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        loadGanttData();
    }, [currentDate, selectedFloor]); 

    const floors = [...new Set(rooms.map(r => r.tang))].sort((a, b) => a - b);
    
    const displayedRooms = selectedFloor 
        ? rooms.filter(r => r.tang === parseInt(selectedFloor)) 
        : rooms;

    const nextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + 7);
        setCurrentDate(next);
    };

    const prevWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(currentDate.getDate() - 7);
        setCurrentDate(prev);
    };

    const goToday = () => {
        setCurrentDate(new Date());
    };

    const formatDay = (date) => date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    const handleShowCheckinList = async () => {
        const todayStr = formatForAPI(new Date()); 
        try {
            const data = await fetchDailyCheckins(todayStr); 
            setDailyCheckins(data);
            setIsShowCheckinModal(true); 
        } catch (error) {
            console.error(error);
        }
    };

    const handleProcessCheckinFromModal = (checkinItem) => {
        setIsShowCheckinModal(false); 
        const mappedBooking = {
            id: checkinItem.id, 
            roomId: checkinItem.roomId,
            guestName: checkinItem.guestName,
            cccd: checkinItem.cccd,
            status: checkinItem.status
        };
        setOpenCheckinFormDirectly(true);
        setSelectedBooking(mappedBooking); 
        setActiveTab('info');
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
                <CalendarHeader 
                    currentDate={currentDate} 
                    setCurrentDate={setCurrentDate}
                    selectedFloor={selectedFloor}
                    setSelectedFloor={setSelectedFloor}
                    prevWeek={prevWeek}
                    nextWeek={nextWeek}
                    startOfWeek={startOfWeek}
                    endOfWeek={endOfWeek}
                    goToday={goToday}
                    formatDay={formatDay}
                    onShowCheckinList={handleShowCheckinList} 
                    floors={floors}
                />

                <GanttChart 
                    currentDate={currentDate}
                    rooms={displayedRooms}
                    bookings={bookings}
                    onSelectBooking={(booking) => {
                        setOpenCheckinFormDirectly(false);
                        setSelectedBooking(booking);
                        setActiveTab('info');
                    }}
                />

                <QuickStatusCards onShowCheckinList={handleShowCheckinList} />
            </div>

            <BookingDrawer 
                selectedBooking={selectedBooking}
                setSelectedBooking={setSelectedBooking}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                rooms={rooms}
                onRefresh={loadGanttData}
                openCheckinFormDirectly={openCheckinFormDirectly}
            />

            <CheckinListModal 
                isOpen={isShowCheckinModal}
                onClose={() => setIsShowCheckinModal(false)}
                checkins={dailyCheckins}
                rooms={rooms} 
                onProcessCheckin={handleProcessCheckinFromModal} 
            />
        </AdminLayout>
    );
}
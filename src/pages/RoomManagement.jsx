import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { roomService } from '../services/room.service'; 
import { roomTypeService } from '../services/roomType.service'; 
import AdminLayout from '../components/Layout/AdminLayout';
import ConfirmModal from '../components/UI/ConfirmModal';

export default function RoomManagement() {
    const [rooms, setRooms] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    
    // ĐÃ FIX: Đổi maLoaiPhong thành loaiPhongId
    const [formData, setFormData] = useState({
        soPhong: '', loaiPhongId: '', tang: '', trangThai: 'Sẵn sàng'
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // FETCH DATA
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [roomsRes, roomTypesRes] = await Promise.all([
                roomService.getAll(), 
                roomTypeService.getAll() 
            ]);
            setRooms(roomsRes.data);
            setRoomTypes(roomTypesRes.data);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const filteredRooms = rooms.filter(r => 
        r.soPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tenLoaiPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.trangThai?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    const handleGenerateReport = () => {
        let csvContent = "Số Phòng,Hạng Phòng,Tầng,Trạng Thái\n";
        filteredRooms.forEach(r => {
            csvContent += `${r.soPhong},${r.tenLoaiPhong},Tầng ${r.tang},${r.trangThai}\n`;
        });
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bao_Cao_Phong_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Đã xuất báo cáo thành công!");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'tang' && value < 0) return;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({ 
            soPhong: '', 
            loaiPhongId: roomTypes.length > 0 ? roomTypes[0].id : '', // ĐÃ FIX
            tang: '1', 
            trangThai: 'Sẵn sàng' 
        });
        setIsModalOpen(true);
    };

    const openEditModal = (room) => {
        setEditId(room.id); 
        setFormData({
            soPhong: room.soPhong,
            loaiPhongId: room.loaiPhongId || room.maLoaiPhong || '', // ĐÃ FIX: Lấy chuẩn ID
            tang: room.tang,
            trangThai: room.trangThai
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.soPhong.trim()) return toast.error("Vui lòng nhập Số phòng!");
        if (!formData.loaiPhongId) return toast.error("Vui lòng chọn Hạng phòng!");

        // ĐÃ FIX: Đảm bảo format gửi lên chuẩn xác
        const payload = { 
            soPhong: formData.soPhong,
            loaiPhongId: formData.loaiPhongId,
            tang: parseInt(formData.tang),
            trangThai: formData.trangThai
        };
        
        const toastId = toast.loading('Đang xử lý...');

        try {
            if (editId) {
                await roomService.update(editId, payload); 
                toast.success('Cập nhật phòng thành công!', { id: toastId });
            } else {
                await roomService.create(payload); 
                toast.success('Thêm phòng mới thành công!', { id: toastId });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            // Hiển thị lỗi Validation từ backend nếu có
            const errorMsg = error.response?.data?.title || error.response?.data || 'Có lỗi xảy ra!';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Kiểm tra lại dữ liệu!', { id: toastId });
        }
    };

    const requestDelete = (id, soPhong) => {
        setItemToDelete({ id, ten: soPhong });
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setIsConfirmOpen(false);
        const toastId = toast.loading('Đang xóa...');
        try {
            await roomService.delete(itemToDelete.id); 
            toast.success(`Đã xóa phòng ${itemToDelete.ten}`, { id: toastId });
            
            if (currentRooms.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
            else fetchData();
        } catch (error) {
            toast.error('Không thể xóa phòng này!', { id: toastId });
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'Sẵn sàng': return { bg: 'bg-purple-50 text-purple-700', icon: '✨' }; 
            case 'Đang sử dụng': return { bg: 'bg-blue-50 text-blue-700', icon: '👤' }; 
            case 'Đang dọn': return { bg: 'bg-yellow-50 text-yellow-700', icon: '🧹' }; 
            case 'Bảo trì': return { bg: 'bg-gray-100 text-gray-500', icon: '🔧' }; 
            default: return { bg: 'bg-gray-100 text-gray-500', icon: '📌' };
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center mb-8">
                    <div className="relative w-80">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#344054] shadow-sm" 
                            placeholder="Tìm kiếm theo số phòng, trạng thái..." />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-500"></span>Sẵn sàng</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Có khách</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Đang dọn</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Bảo trì</span>
                        </div>
                        <button onClick={handleGenerateReport} className="bg-[#344054] hover:bg-[#1d2939] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition shadow-sm">
                            Lập báo cáo Excel
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-[#101828]">Quản Lý Phòng</h2>
                            <p className="text-sm text-gray-500 mt-2">Trạng thái trực tiếp của tổng số {filteredRooms.length} phòng khách sạn và phòng thương gia.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
                        
                        {isLoading ? (
                            <div className="col-span-full text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                        ) : (
                            currentRooms.map((room) => {
                                const style = getStatusStyle(room.trangThai);
                                return (
                                    <div key={room.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 relative group hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between min-h-[180px]"> 
                                        
                                        <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditModal(room)} className="p-2 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-lg transition">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                            </button>
                                            <button onClick={() => requestDelete(room.id, room.soPhong)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition"> 
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </div>

                                        <div>
                                            <h2 className="text-4xl font-black text-gray-900 mb-2">{room.soPhong}</h2>
                                            <h3 className="font-bold text-gray-800 text-base">{room.tenLoaiPhong}</h3>
                                            <p className="text-xs text-gray-500 font-medium mt-1">Khu vực Tầng {room.tang}</p>
                                        </div>

                                        <div className="flex justify-between items-end mt-6">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md ${style.bg}`}>
                                                {room.trangThai}
                                            </span>
                                            <span className="text-gray-300 text-xl" title="Trạng thái">
                                                {style.icon}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {!isLoading && (
                            <button onClick={openAddModal} className="bg-gray-50 rounded-3xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center min-h-[180px] hover:bg-gray-100 hover:border-[#344054] transition group cursor-pointer">
                                <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#344054] group-hover:scale-110 transition-transform mb-3">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <h3 className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Thêm Phòng Mới</h3>
                            </button>
                        )}
                    </div>

                    {totalPages > 0 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                            <span className="text-sm text-gray-500">
                                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRooms.length)} trong tổng số {filteredRooms.length} phòng
                            </span>
                            <div className="flex gap-1 items-center">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className={`p-1.5 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button key={page} onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded text-sm font-medium transition ${currentPage === page ? 'bg-[#344054] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                                        {page}
                                    </button>
                                ))}

                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className={`p-1.5 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">{editId ? 'Sửa Thông Tin Phòng' : 'Thêm Phòng Mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-gray-50/30">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Số phòng <span className="text-red-500">*</span></label>
                                <input type="text" name="soPhong" value={formData.soPhong} onChange={handleChange} required
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white font-bold" placeholder="VD: 101, 205B" />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hạng phòng <span className="text-red-500">*</span></label>
                                {/* ĐÃ FIX: select name="loaiPhongId" */}
                                <select name="loaiPhongId" value={formData.loaiPhongId} onChange={handleChange} required
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white">
                                    <option value="" disabled>-- Chọn hạng phòng --</option>
                                    {roomTypes.map(rt => (
                                        <option key={rt.id} value={rt.id}>{rt.tenLoaiPhong}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Khu vực Tầng <span className="text-red-500">*</span></label>
                                    <input type="number" name="tang" value={formData.tang} onChange={handleChange} required min="1"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" placeholder="1" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái hiện tại</label>
                                    <select name="trangThai" value={formData.trangThai} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white font-medium">
                                        <option value="Sẵn sàng">Sẵn sàng</option>
                                        <option value="Đang sử dụng">Đang sử dụng</option>
                                        <option value="Đang dọn">Đang dọn</option>
                                        <option value="Bảo trì">Bảo trì</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3 border-t border-gray-100 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition">Hủy bỏ</button>
                                <button type="submit"
                                    className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white font-semibold py-3 rounded-lg transition shadow-md">
                                    {editId ? 'Lưu Thay Đổi' : 'Thêm Phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={isConfirmOpen} title="Xác nhận xóa phòng"
                message={`Bạn có chắc chắn muốn xóa phòng "${itemToDelete?.ten}" khỏi hệ thống không?`}
                onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)}
            />
        </AdminLayout>
    );
}
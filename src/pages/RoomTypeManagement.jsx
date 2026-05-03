import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { roomTypeService } from '../services/roomType.service'; 
import AdminLayout from '../components/Layout/AdminLayout';
import ConfirmModal from '../components/UI/ConfirmModal';

export default function RoomTypeManagement() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; 
    
    // Modal Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tenLoaiPhong: '', giaCoBan: '', soNguoiToiDa: '', anhDaiDien: '', moTa: ''
    });

    // Modal Xóa
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // FETCH DATA
    const fetchRoomTypes = async () => {
        setIsLoading(true);
        try {
            const response = await roomTypeService.getAll(); // ĐÃ FIX
            setRoomTypes(response.data);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRoomTypes(); }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // LỌC DỮ LIỆU
    const filteredRooms = roomTypes.filter(room => 
        room.tenLoaiPhong?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.moTa && room.moTa.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const validateForm = () => {
        if (!formData.tenLoaiPhong.trim()) return "Vui lòng nhập tên loại phòng!";
        if (!formData.giaCoBan || parseFloat(formData.giaCoBan) < 0) return "Giá cơ bản phải là số dương!";
        if (!formData.soNguoiToiDa || parseInt(formData.soNguoiToiDa) < 1) return "Sức chứa tối thiểu là 1 người!";
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if ((name === 'giaCoBan' || name === 'soNguoiToiDa') && value < 0) return;
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({ tenLoaiPhong: '', giaCoBan: '', soNguoiToiDa: '', anhDaiDien: '', moTa: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (room) => {
        setEditId(room.id); // ĐÃ FIX: Dùng Guid ID
        setFormData({
            tenLoaiPhong: room.tenLoaiPhong, 
            giaCoBan: room.giaCoBan, 
            soNguoiToiDa: room.soNguoiToiDa, 
            anhDaiDien: room.anhDaiDien || '',
            moTa: room.moTa || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errorMsg = validateForm();
        if (errorMsg) {
            toast.error(errorMsg);
            return;
        }

        const payload = {
            ...formData, 
            giaCoBan: parseFloat(formData.giaCoBan), 
            soNguoiToiDa: parseInt(formData.soNguoiToiDa)
        };

        const toastId = toast.loading('Đang xử lý...');
        try {
            if (editId) {
                await roomTypeService.update(editId, payload); // ĐÃ FIX
                toast.success('Cập nhật thành công!', { id: toastId });
            } else {
                await roomTypeService.create(payload); // ĐÃ FIX
                toast.success('Thêm mới thành công!', { id: toastId });
            }
            setIsModalOpen(false);
            fetchRoomTypes();
        } catch (error) {
            toast.error(error.response?.data || 'Có lỗi xảy ra!', { id: toastId });
        }
    };

    const requestDelete = (id, name) => {
        setItemToDelete({ id, ten: name });
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsConfirmOpen(false);
        const toastId = toast.loading('Đang xóa...');
        try {
            await roomTypeService.delete(itemToDelete.id); // ĐÃ FIX
            toast.success(`Đã xóa "${itemToDelete.ten}"`, { id: toastId });
            
            if (currentRooms.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchRoomTypes();
            }
        } catch (error) {
            toast.error(error.response?.data || 'Không thể xóa loại phòng này!', { id: toastId });
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

    const getBadgeStyle = (price) => {
        if (price >= 2000000) return { text: 'CAO CẤP', style: 'bg-purple-100 text-purple-700' };
        if (price >= 1000000) return { text: 'PHỔ BIẾN', style: 'bg-blue-100 text-blue-700' };
        return { text: 'TIÊU CHUẨN', style: 'bg-gray-100 text-gray-700' };
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                
                <div className="flex items-center">
                    <div className="relative w-96">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                        <input type="text" className="w-full bg-white shadow-sm border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#344054] transition" 
                            placeholder="Tìm kiếm loại phòng..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">QUẢN LÝ / DANH MỤC</p>
                            <h2 className="text-3xl font-extrabold text-[#101828]">Loại Phòng</h2>
                            <p className="text-sm text-gray-500 mt-2">Quản lý các hạng phòng độc quyền của khách sạn. Cài đặt mức giá cơ bản và sức chứa tại một bảng điều khiển duy nhất.</p>
                        </div>
                        <button onClick={openAddModal} className="bg-[#344054] hover:bg-[#1d2939] text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm flex items-center gap-2">
                            <span>+</span> Thêm Hạng Phòng
                        </button>
                    </div>

                    <div className="overflow-x-auto min-h-[450px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Ảnh đại diện</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tên loại phòng</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Giá cơ bản</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sức chứa</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mô tả</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right pr-4">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr><td colSpan="6" className="text-center py-12 text-gray-500">Đang tải dữ liệu...</td></tr>
                                ) : filteredRooms.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-12 text-gray-500">Không tìm thấy loại phòng nào.</td></tr>
                                ) : (
                                    currentRooms.map((room) => {
                                        const badge = getBadgeStyle(room.giaCoBan);
                                        return (
                                            <tr key={room.id} className="hover:bg-gray-50/50 transition">
                                                <td className="py-5">
                                                    {room.anhDaiDien ? (
                                                        <img src={room.anhDaiDien} alt={room.tenLoaiPhong} className="h-16 w-24 object-cover rounded-lg shadow-sm border border-gray-100" />
                                                    ) : (
                                                        <div className="h-16 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs border border-gray-200">No Image</div>
                                                    )}
                                                </td>
                                                <td className="py-5">
                                                    <div className="font-bold text-gray-900 text-base">{room.tenLoaiPhong}</div>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded ${badge.style}`}>
                                                        {badge.text}
                                                    </span>
                                                </td>
                                                <td className="py-5">
                                                    <div className="font-bold text-gray-900 text-base">{formatCurrency(room.giaCoBan)}</div>
                                                    <div className="text-xs text-gray-500 mt-1">/ đêm</div>
                                                </td>
                                                <td className="py-5">
                                                    <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
                                                        <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                                                        {room.soNguoiToiDa} Người lớn
                                                    </div>
                                                </td>
                                                <td className="py-5">
                                                    <p className="text-sm text-gray-500 line-clamp-2 max-w-xs" title={room.moTa}>
                                                        {room.moTa || 'Chưa có mô tả cho hạng phòng này.'}
                                                    </p>
                                                </td>
                                                <td className="py-5 text-right pr-4">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button onClick={() => openEditModal(room)} className="text-gray-400 hover:text-[#344054] transition">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                        </button>
                                                        <button onClick={() => requestDelete(room.id, room.tenLoaiPhong)} className="text-gray-400 hover:text-red-500 transition">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>

                        {totalPages > 0 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                                <span className="text-sm text-gray-500">
                                    Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRooms.length)} trong tổng số {filteredRooms.length} Loại phòng
                                </span>
                                <div className="flex gap-1 items-center">
                                    <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}
                                        className={`p-1.5 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                    </button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button key={page} onClick={() => changePage(page)}
                                            className={`w-8 h-8 rounded text-sm font-medium transition ${currentPage === page ? 'bg-[#344054] text-white' : 'hover:bg-gray-100 text-gray-600'}`}>
                                            {page}
                                        </button>
                                    ))}

                                    <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}
                                        className={`p-1.5 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-down">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editId ? 'Cập Nhật Hạng Phòng' : 'Tạo Hạng Phòng Mới'}</h3>
                                <p className="text-sm text-gray-500 mt-1">Vui lòng điền đầy đủ thông tin bên dưới.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-gray-50/30">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên hạng phòng <span className="text-red-500">*</span></label>
                                <input type="text" name="tenLoaiPhong" value={formData.tenLoaiPhong} onChange={handleChange} required
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] focus:border-[#344054] outline-none transition bg-white" placeholder="VD: Signature Suite" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá cơ bản (VNĐ) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-medium">₫</span>
                                        <input type="number" name="giaCoBan" value={formData.giaCoBan} onChange={handleChange} required min="0"
                                            className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] focus:border-[#344054] outline-none transition bg-white" placeholder="0" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Sức chứa tối đa <span className="text-red-500">*</span></label>
                                    <input type="number" name="soNguoiToiDa" value={formData.soNguoiToiDa} onChange={handleChange} required min="1"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] focus:border-[#344054] outline-none transition bg-white" placeholder="VD: 2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả ngắn</label>
                                <textarea name="moTa" value={formData.moTa} onChange={handleChange} rows="2"
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none transition bg-white resize-none" placeholder="Điểm nổi bật của phòng..."></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đường dẫn ảnh đại diện</label>
                                <input type="url" name="anhDaiDien" value={formData.anhDaiDien} onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none transition bg-white" placeholder="https://..." />
                            </div>

                            <div className="pt-6 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition">Đóng</button>
                                <button type="submit"
                                    className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white font-semibold py-3 rounded-lg transition shadow-md">
                                    {editId ? 'Lưu Thay Đổi' : 'Xác Nhận Thêm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={isConfirmOpen} title="Xác nhận xóa hạng phòng"
                message={`Bạn có chắc chắn muốn xóa hạng phòng "${itemToDelete?.ten}" không? Các phòng thuộc hạng này có thể bị ảnh hưởng.`}
                onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)}
            />
        </AdminLayout>
    );
}
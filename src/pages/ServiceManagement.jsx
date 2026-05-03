import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { serviceService } from '../services/service.service';
import AdminLayout from '../components/Layout/AdminLayout';
import ConfirmModal from '../components/UI/ConfirmModal';

export default function ServiceManagement() {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Modal Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        tenDichVu: '', gia: '', moTa: '', loaiDichVu: 'Ẩm thực', trangThai: 'Hoạt động'
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // FETCH DATA
    const fetchServices = async () => {
        setIsLoading(true);
        try {
            // ĐÃ FIX: Thêm từ khóa await
            const response = await serviceService.getAll();
            setServices(response.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchServices(); }, []);

    // RESET VỀ TRANG 1 KHI GÕ TÌM KIẾM
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // LỌC TÌM KIẾM
    const filteredServices = services.filter(svc =>
        svc.tenDichVu?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.loaiDichVu?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- LOGIC PHÂN TRANG (PAGINATION) ---
    const totalPages = Math.ceil(filteredServices.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentServices = filteredServices.slice(startIndex, startIndex + itemsPerPage);

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // VALIDATE
    const validateForm = () => {
        if (!formData.tenDichVu.trim()) return "Vui lòng nhập tên dịch vụ!";
        if (!formData.gia || parseFloat(formData.gia) < 0) return "Đơn giá phải là số dương!";
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'gia' && value < 0) return; // Chặn số âm
        setFormData({ ...formData, [name]: value });
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({ tenDichVu: '', gia: '', moTa: '', loaiDichVu: 'Ẩm thực', trangThai: 'Hoạt động' });
        setIsModalOpen(true);
    };

    const openEditModal = (svc) => {
        // ĐÃ FIX: Hỗ trợ ID chuẩn là Guid
        setEditId(svc.id || svc.maDichVu);
        setFormData({
            tenDichVu: svc.tenDichVu,
            gia: svc.gia,
            moTa: svc.moTa || '',
            loaiDichVu: svc.loaiDichVu || 'Khác',
            trangThai: svc.trangThai || 'Hoạt động'
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errorMsg = validateForm();
        if (errorMsg) { toast.error(errorMsg); return; }

        const payload = { ...formData, gia: parseFloat(formData.gia) };
        const toastId = toast.loading('Đang xử lý...');

        try {
            if (editId) {
                await serviceService.update(editId, payload);
                toast.success('Cập nhật thành công!', { id: toastId });
            } else {
                await serviceService.create(payload);
                toast.success('Thêm mới thành công!', { id: toastId });
            }
            setIsModalOpen(false);
            fetchServices();
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
            await serviceService.delete(itemToDelete.id);
            toast.success(`Đã xóa "${itemToDelete.ten}"`, { id: toastId });

            if (currentServices.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchServices();
            }

        } catch (error) {
            toast.error(error.response?.data || 'Không thể xóa dịch vụ này!', { id: toastId });
        }
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

    const getCategoryStyle = (category) => {
        switch (category) {
            case 'Ẩm thực': return { icon: <span className="text-xl">🍽️</span>, bg: 'bg-[#FFFBEB] text-[#F59E0B]' };
            case 'Spa & Làm đẹp': return { icon: <span className="text-xl">💆</span>, bg: 'bg-[#F5F3FF] text-[#8B5CF6]' };
            case 'Giặt là': return { icon: <span className="text-xl">👕</span>, bg: 'bg-[#EFF6FF] text-[#3B82F6]' };
            case 'Thể thao': return { icon: <span className="text-xl">🏋️</span>, bg: 'bg-[#F0FDF4] text-[#10B981]' };
            case 'Vận chuyển': return { icon: <span className="text-xl">🚗</span>, bg: 'bg-[#F9FAFB] text-[#6B7280]' };
            case 'Tiện ích': return { icon: <span className="text-xl">🔧</span>, bg: 'bg-[#FEF2F2] text-[#EF4444]' };
            case 'Giải trí': return { icon: <span className="text-xl">🎮</span>, bg: 'bg-[#FDF2F8] text-[#EC4899]' };
            case 'Phòng': return { icon: <span className="text-xl">🛏️</span>, bg: 'bg-[#EFF6FF] text-[#00224f]' };
            default: return { icon: <span className="text-xl">⭐</span>, bg: 'bg-[#FFFBEB] text-[#c9a84c]' };
        }
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex items-center">
                    <div className="relative w-96">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </span>
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#344054] transition shadow-sm"
                            placeholder="Tìm kiếm dịch vụ hoặc danh mục..." />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">QUẢN LÝ / DỊCH VỤ</p>
                            <h2 className="text-3xl font-extrabold text-[#101828]">Dịch vụ Khách sạn</h2>
                            <p className="text-sm text-gray-500 mt-2">Quản lý và thiết lập các dịch vụ cộng thêm cao cấp dành cho khách hàng.</p>
                        </div>
                        <button onClick={openAddModal} className="bg-[#344054] hover:bg-[#1d2939] text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm flex items-center gap-2">
                            <span>+</span> Thêm Dịch Vụ Mới
                        </button>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tên dịch vụ</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Danh mục</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Đơn giá</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Mô tả chi tiết</th>
                                    <th className="py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {isLoading ? (
                                    <tr><td colSpan="5" className="text-center py-12 text-gray-500">Đang tải dữ liệu...</td></tr>
                                ) : filteredServices.length === 0 ? (
                                    <tr><td colSpan="5" className="text-center py-12 text-gray-500">Không tìm thấy dịch vụ nào.</td></tr>
                                ) : (
                                    currentServices.map((svc) => {
                                        const catStyle = getCategoryStyle(svc.loaiDichVu);
                                        const isAvailable = svc.trangThai === 'Hoạt động';
                                        const svcId = svc.id || svc.maDichVu; // ĐÃ FIX

                                        return (
                                            <tr key={svcId} className="hover:bg-gray-50/50 transition cursor-pointer group" onClick={() => openEditModal(svc)}>
                                                <td className="py-5 flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStyle.bg}`}>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{catStyle.icon}</svg>
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-sm">{svc.tenDichVu}</span>
                                                </td>
                                                <td className="py-5">
                                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                                        {svc.loaiDichVu}
                                                    </span>
                                                </td>
                                                <td className="py-5 font-bold text-gray-900 text-sm">
                                                    {formatCurrency(svc.gia)}
                                                </td>
                                                <td className="py-5">
                                                    <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">{svc.moTa || '---'}</p>
                                                </td>
                                                <td className="py-5 flex items-center justify-between">
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isAvailable ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-purple-500' : 'bg-gray-400'}`}></span>
                                                        {svc.trangThai}
                                                    </span>

                                                    <button onClick={(e) => { e.stopPropagation(); requestDelete(svcId, svc.tenDichVu); }}
                                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-2">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
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
                                    Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredServices.length)} trong tổng số {filteredServices.length} dịch vụ
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

                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-[#F8F9FB] rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-[#344054] font-bold mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Mẹo tối ưu hóa thông minh
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Dựa trên định giá dịch vụ hiện tại của bạn, "Spa Đá Nóng Đặc Biệt" đang có giá thấp hơn 15% so với mức trung bình của các khách sạn hạng sang trong khu vực. Việc điều chỉnh giá này có thể làm tăng doanh thu hàng tháng lên xấp xỉ 12.500.000 ₫.
                        </p>
                    </div>
                    <div className="col-span-1 rounded-2xl overflow-hidden shadow-sm h-40">
                        <img src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80" alt="Spa Insight" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-down">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editId ? 'Sửa Dịch Vụ' : 'Thêm Dịch Vụ Mới'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5 bg-gray-50/30">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên dịch vụ <span className="text-red-500">*</span></label>
                                    <input type="text" name="tenDichVu" value={formData.tenDichVu} onChange={handleChange} required
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] focus:border-[#344054] outline-none transition bg-white" placeholder="VD: Bữa tối tại phòng" />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Danh mục</label>
                                    <select name="loaiDichVu" value={formData.loaiDichVu} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white">

                                        {/* 👉 CÁC OPTION MỚI VỪA ĐƯỢC THÊM VÀO */}
                                        <option value="Ẩm thực">Ẩm thực</option>
                                        <option value="Spa & Làm đẹp">Spa & Làm đẹp</option>
                                        <option value="Giặt là">Giặt là</option>
                                        <option value="Thể thao">Thể thao</option>
                                        <option value="Vận chuyển">Vận chuyển</option>
                                        <option value="Tiện ích">Tiện ích</option>
                                        <option value="Giải trí">Giải trí</option>
                                        <option value="Phòng">Phòng</option>
                                        <option value="Khác">Khác</option>

                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đơn giá (VNĐ) <span className="text-red-500">*</span></label>
                                    <input type="number" name="gia" value={formData.gia} onChange={handleChange} required min="0"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" placeholder="0" />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Trạng thái</label>
                                    <select name="trangThai" value={formData.trangThai} onChange={handleChange}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white">
                                        <option value="Hoạt động">Hoạt động (Available)</option>
                                        <option value="Tạm ngưng">Tạm ngưng (Unavailable)</option>
                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mô tả chi tiết</label>
                                    <textarea name="moTa" value={formData.moTa} onChange={handleChange} rows="2"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none transition bg-white resize-none" placeholder="Chi tiết dịch vụ..."></textarea>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition">Hủy bỏ</button>
                                <button type="submit"
                                    className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white font-semibold py-3 rounded-lg transition shadow-md">
                                    {editId ? 'Lưu Thay Đổi' : 'Thêm Dịch Vụ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen} title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa dịch vụ "${itemToDelete?.ten}" không?`}
                onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)}
            />
        </AdminLayout>
    );
}
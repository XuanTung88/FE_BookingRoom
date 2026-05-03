import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { pricingService } from '../services/pricing.service';
import { roomTypeService } from '../services/roomType.service';
import AdminLayout from '../components/Layout/AdminLayout';
import ConfirmModal from '../components/UI/ConfirmModal';

export default function PricePolicyManagement() {
    const [policies, setPolicies] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // --- STATE PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    // Modal Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // ĐÃ FIX: Đổi 'maLoaiPhong' thành 'loaiPhongId' chuẩn theo Swagger
    const [formData, setFormData] = useState({
        loaiPhongId: '', tenChinhSach: '', tuNgay: '', denNgay: '',
        apDungChoThu: 'ALL', loaiDieuChinh: 'Cộng thẳng',
        giaTriDieuChinh: '', doUuTien: 1, trangThai: 'Kích hoạt'
    });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // FETCH DATA
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [policiesRes, roomTypesRes] = await Promise.all([
                pricingService.getAll(),
                roomTypeService.getAll()
            ]);
            setPolicies(policiesRes.data);
            setRoomTypes(roomTypesRes.data);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu từ máy chủ!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // RESET VỀ TRANG 1 KHI TÌM KIẾM
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const filteredPolicies = policies.filter(p =>
        p.tenChinhSach?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tenLoaiPhong?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- LOGIC PHÂN TRANG ---
    const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPolicies = filteredPolicies.slice(startIndex, startIndex + itemsPerPage);

    const changePage = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // XỬ LÝ FORM
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if ((name === 'giaTriDieuChinh' || name === 'doUuTien') && value < 0) return;

        if (name === 'trangThaiToggle') {
            setFormData({ ...formData, trangThai: checked ? 'Kích hoạt' : 'Tạm ngưng' });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const validateForm = () => {
        if (!formData.loaiPhongId) return "Vui lòng chọn Loại phòng áp dụng!";
        if (!formData.tenChinhSach.trim()) return "Vui lòng nhập Tên chính sách!";
        if (!formData.giaTriDieuChinh || parseFloat(formData.giaTriDieuChinh) <= 0) return "Giá trị điều chỉnh phải lớn hơn 0!";
        if (formData.tuNgay && formData.denNgay && new Date(formData.tuNgay) > new Date(formData.denNgay)) {
            return "Từ ngày không được sau Đến ngày!";
        }
        return null;
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({
            // Khởi tạo ID mặc định
            loaiPhongId: roomTypes.length > 0 ? (roomTypes[0].id || roomTypes[0].loaiPhongId) : '',
            tenChinhSach: '', tuNgay: '', denNgay: '',
            apDungChoThu: 'ALL', loaiDieuChinh: 'Cộng thẳng',
            giaTriDieuChinh: '', doUuTien: 1, trangThai: 'Kích hoạt'
        });
        setIsModalOpen(true);
    };

    const openEditModal = (policy) => {
        setEditId(policy.id || policy.maChinhSach);
        setFormData({
            loaiPhongId: policy.loaiPhongId || policy.idLoaiPhong || policy.maLoaiPhong,
            tenChinhSach: policy.tenChinhSach,
            tuNgay: policy.tuNgay ? policy.tuNgay.split('T')[0] : '',
            denNgay: policy.denNgay ? policy.denNgay.split('T')[0] : '',
            apDungChoThu: policy.apDungChoThu,
            loaiDieuChinh: policy.loaiDieuChinh,
            giaTriDieuChinh: policy.giaTriDieuChinh,
            doUuTien: policy.doUuTien,
            trangThai: policy.trangThai
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errorMsg = validateForm();
        if (errorMsg) { toast.error(errorMsg); return; }

        // ĐÃ FIX: Chuyển đổi dữ liệu chuẩn 100% theo Swagger ChinhSachGiaVM
        const payload = {
            loaiPhongId: formData.loaiPhongId, // Giữ nguyên dạng chuỗi Guid, tuyệt đối không dùng parseInt
            tenChinhSach: formData.tenChinhSach,
            loaiDieuChinh: formData.loaiDieuChinh,
            apDungChoThu: formData.apDungChoThu,
            trangThai: formData.trangThai,
            giaTriDieuChinh: parseFloat(formData.giaTriDieuChinh),
            doUuTien: parseInt(formData.doUuTien),
            // Định dạng ISO Date nếu có, nếu không thì null
            tuNgay: formData.tuNgay ? new Date(formData.tuNgay).toISOString() : null,
            denNgay: formData.denNgay ? new Date(formData.denNgay).toISOString() : null,
        };

        const toastId = toast.loading('Đang xử lý...');
        try {
            if (editId) {
                await pricingService.update(editId, payload);
                toast.success('Cập nhật thành công!', { id: toastId });
            } else {
                await pricingService.create(payload);
                toast.success('Thêm mới thành công!', { id: toastId });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            // Lấy lỗi validation mảng từ Backend hiển thị
            const errData = error.response?.data;
            let errMsg = 'Có lỗi xảy ra!';
            if (errData?.errors) {
                errMsg = Object.values(errData.errors).flat().join('\n');
            } else if (errData?.message) {
                errMsg = errData.message;
            } else if (typeof errData === 'string') {
                errMsg = errData;
            }
            toast.error(errMsg, { id: toastId });
        }
    };

    const handleToggle = async (id) => {
        try {
            // Mapping chuẩn API /api/pricing-policies/{id}/toggle (PATCH)
            await pricingService.toggle(id);
            fetchData();
            toast.success('Đã thay đổi trạng thái!');
        } catch (error) {
            toast.error('Lỗi khi thay đổi trạng thái!');
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
            await pricingService.delete(itemToDelete.id);
            toast.success(`Đã xóa "${itemToDelete.ten}"`, { id: toastId });

            if (currentPolicies.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchData();
            }
        } catch (error) {
            toast.error('Không thể xóa chính sách này!', { id: toastId });
        }
    };

    // FORMAT HELPERS
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Vô thời hạn';
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatValue = (value, type) => {
        if (type === 'Phần trăm' || type === '%') return `${value}%`;
        return new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
    };

    const getAdjustmentStyle = (type) => {
        return type === 'Cộng thẳng' ? 'text-blue-600' : 'text-orange-600';
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-end mb-8">
                    <div className="flex-1">
                        <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">QUẢN LÝ / CHÍNH SÁCH</p>
                        <h2 className="text-3xl font-extrabold text-[#101828]">Chính Sách Giá</h2>
                        <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                            Quản lý chiến lược giá động, điều chỉnh giá phòng theo ngày lễ, cuối tuần, hoặc các chương trình khuyến mãi.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative w-72">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </span>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#344054] shadow-sm"
                                placeholder="Tìm kiếm chính sách..." />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                        {isLoading ? (
                            <div className="col-span-full text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                        ) : filteredPolicies.length === 0 ? (
                            <div className="col-span-full text-center py-10 text-gray-500">Không tìm thấy chính sách nào.</div>
                        ) : (
                            currentPolicies.map((policy) => {
                                const policyId = policy.id || policy.maChinhSach;
                                const isKichHoat = policy.trangThai === 'Kích hoạt';
                                return (
                                    <div key={policyId} className={`bg-white rounded-2xl border border-gray-200 p-6 flex flex-col relative transition-all hover:border-[#344054] hover:shadow-md ${!isKichHoat ? 'opacity-60 grayscale-[30%]' : ''}`}>

                                        <div className="flex justify-between items-start mb-4">
                                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F3F6FD] text-blue-700 border border-blue-100 max-w-[120px] truncate" title={policy.tenLoaiPhong}>
                                                {policy.tenLoaiPhong || 'Loại phòng'}
                                            </span>

                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" checked={isKichHoat} onChange={() => handleToggle(policyId)} />
                                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#344054]"></div>
                                            </label>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2 min-h-[56px]" title={policy.tenChinhSach}>{policy.tenChinhSach}</h3>

                                        <div className="space-y-3 mb-6 flex-1">
                                            <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <span className="truncate">{formatDate(policy.tuNgay)} &rarr; {formatDate(policy.denNgay)}</span>
                                            </div>

                                            <div className={`flex items-center gap-3 text-sm font-bold ${getAdjustmentStyle(policy.loaiDieuChinh)}`}>
                                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                </svg>
                                                <span>
                                                    {policy.loaiDieuChinh}: {formatValue(policy.giaTriDieuChinh, policy.loaiDieuChinh)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-sm">
                                                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                <span className="text-gray-600 font-medium truncate">Áp dụng: {policy.apDungChoThu}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditModal(policy)} className="p-1.5 text-gray-400 hover:text-[#344054] transition bg-gray-50 hover:bg-gray-100 rounded">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                </button>
                                                <button onClick={() => requestDelete(policyId, policy.tenChinhSach)} className="p-1.5 text-gray-400 hover:text-red-500 transition bg-gray-50 hover:bg-red-50 rounded">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">Ưu tiên: {policy.doUuTien}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {!isLoading && (
                            <button onClick={openAddModal} className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-center min-h-[310px] hover:bg-gray-100 hover:border-[#344054] transition group cursor-pointer">
                                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#344054] group-hover:scale-110 transition-transform mb-4">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Tạo Chính Sách Mới</h3>
                                <p className="text-sm text-gray-500 text-center max-w-[200px]">Thiết lập quy tắc giá mới cho các hạng phòng.</p>
                            </button>
                        )}
                    </div>

                    {totalPages > 0 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                            <span className="text-sm text-gray-500">
                                Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredPolicies.length)} trong tổng số {filteredPolicies.length} chính sách
                            </span>
                            <div className="flex gap-1 items-center">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-1.5 rounded-md ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => changePage(page)}
                                        className={`w-8 h-8 rounded text-sm font-medium transition ${currentPage === page
                                                ? 'bg-[#344054] text-white'
                                                : 'hover:bg-gray-100 text-gray-600'
                                            }`}>
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-1.5 rounded-md ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in-down max-h-[90vh] flex flex-col">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editId ? 'Sửa Chính Sách' : 'Thêm Chính Sách Mới'}</h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 rounded-full hover:bg-gray-100">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto bg-gray-50/30">
                            <form id="policyForm" onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại phòng áp dụng <span className="text-red-500">*</span></label>
                                        {/* ĐÃ FIX name="loaiPhongId" */}
                                        <select name="loaiPhongId" value={formData.loaiPhongId} onChange={handleChange} required
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white">
                                            <option value="" disabled>-- Chọn hạng phòng --</option>
                                            {roomTypes.map(rt => {
                                                const rtId = rt.id || rt.loaiPhongId;
                                                return <option key={rtId} value={rtId}>{rt.tenLoaiPhong}</option>
                                            })}
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên chính sách <span className="text-red-500">*</span></label>
                                        <input type="text" name="tenChinhSach" value={formData.tenChinhSach} onChange={handleChange} required
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" placeholder="VD: Phụ thu cuối tuần" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Loại điều chỉnh</label>
                                        <select name="loaiDieuChinh" value={formData.loaiDieuChinh} onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white font-medium">
                                            <option value="Cộng thẳng">Cộng thẳng (VNĐ)</option>
                                            <option value="Phần trăm">Phần trăm (%)</option>
                                            <option value="Trừ thẳng">Trừ thẳng (VNĐ)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Giá trị <span className="text-red-500">*</span></label>
                                        <input type="number" name="giaTriDieuChinh" value={formData.giaTriDieuChinh} onChange={handleChange} required min="0" step={formData.loaiDieuChinh === 'Phần trăm' ? '0.1' : '1000'}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white font-bold" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Từ ngày (Để trống nếu áp dụng luôn)</label>
                                        <input type="date" name="tuNgay" value={formData.tuNgay} onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Đến ngày</label>
                                        <input type="date" name="denNgay" value={formData.denNgay} onChange={handleChange} min={formData.tuNgay}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Áp dụng cho thứ</label>
                                        <select name="apDungChoThu" value={formData.apDungChoThu} onChange={handleChange}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white">
                                            <option value="ALL">Tất cả các ngày</option>
                                            <option value="T7, CN">Cuối tuần (T7, CN)</option>
                                            <option value="T2-T6">Ngày thường (T2 - T6)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Độ ưu tiên (Càng cao càng ưu tiên) <span className="text-red-500">*</span></label>
                                        <input type="number" name="doUuTien" value={formData.doUuTien} onChange={handleChange} required min="1"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#344054] outline-none bg-white" />
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between border border-gray-200 p-4 rounded-lg bg-white mt-2">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Kích hoạt ngay</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="trangThaiToggle" className="sr-only peer" checked={formData.trangThai === 'Kích hoạt'} onChange={handleChange} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#344054]"></div>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="px-8 py-5 flex gap-3 border-t border-gray-100 bg-white shrink-0">
                            <button type="button" onClick={() => setIsModalOpen(false)}
                                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition">Hủy bỏ</button>
                            <button type="submit" form="policyForm"
                                className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white font-semibold py-3 rounded-lg transition shadow-md">
                                {editId ? 'Lưu Thay Đổi' : 'Thêm Chính Sách'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={isConfirmOpen} title="Xác nhận xóa"
                message={`Bạn có chắc chắn muốn xóa chính sách "${itemToDelete?.ten}" không?`}
                onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)}
            />
        </AdminLayout>
    );
}
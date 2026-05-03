import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { equipmentService } from '../services/equipment.service'; 
import AdminLayout from '../components/Layout/AdminLayout';
import ConfirmModal from '../components/UI/ConfirmModal';

export default function EquipmentManagement() {
    const [inventory, setInventory] = useState([]);
    const [roomsData, setRoomsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentPage, setCurrentPage] = useState(1);
    const roomsPerPage = 6;

    const [invCurrentPage, setInvCurrentPage] = useState(1);
    const invItemsPerPage = 9;

    // Modals State
    const [isInvModalOpen, setIsInvModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [editingTbpId, setEditingTbpId] = useState(null); 
    
    const [invForm, setInvForm] = useState({ tenThietBi: '', tongSoLuong: '', icon: 'TV' });
    const [assignForm, setAssignForm] = useState({ maThietBi: '', tinhTrang: 'MỚI' });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // --- ĐÃ FIX: QUÉT CHUẨN JSON MỚI TỪ SWAGGER ---
    const getInvId = (item) => item?.id || item?.Id || item?.equipmentId || item?.EquipmentId || item?.thietBiId || item?.ThietBiId || item?.maThietBi;
    const getRoomId = (item) => item?.roomId || item?.RoomId || item?.id || item?.Id || item?.phongId || item?.PhongId || item?.maPhong;
    const getAssignId = (item) => item?.assignId || item?.AssignId || item?.id || item?.Id || item?.thietBiPhongId || item?.ThietBiPhongId || item?.maThietBiPhong;

    // FETCH DATA
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [invRes, roomsRes] = await Promise.all([
                equipmentService.getAll(),
                equipmentService.getAssignments()
            ]);
            setInventory(invRes.data || []);
            setRoomsData(roomsRes.data || []);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        setCurrentPage(1);
        setInvCurrentPage(1);
    }, [searchQuery]);

    // LỌC VÀ PHÂN TRANG
    const filteredInv = inventory.filter(inv => inv.tenThietBi?.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalInvPages = Math.ceil(filteredInv.length / invItemsPerPage);
    const currentInventory = filteredInv.slice((invCurrentPage - 1) * invItemsPerPage, invCurrentPage * invItemsPerPage);

    const filteredRooms = roomsData.filter(r => 
        r.soPhong?.includes(searchQuery) || r.tenLoaiPhong?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const totalPages = Math.ceil(filteredRooms.length / roomsPerPage);
    const currentRooms = filteredRooms.slice((currentPage - 1) * roomsPerPage, currentPage * roomsPerPage);

    // EXPORT FILE
    const handleExportJSON = () => {
        const dataStr = JSON.stringify({ khoThietBi: inventory, thietBiTrongPhong: roomsData }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Tai_San_Khach_San_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Đã tải xuống file dữ liệu JSON!");
    };

    const handleGenerateCSV = () => {
        let csvContent = "Số Phòng,Hạng Phòng,Tên Thiết Bị,Tình Trạng\n";
        roomsData.forEach(r => {
            // ĐÃ FIX: Nhận diện mảng "equipments"
            const thietBis = r.equipments || r.Equipments || r.thietBis || r.ThietBis || r.thietBiPhongs || r.ThietBiPhongs || [];
            thietBis.forEach(tb => {
                const tenTb = tb.tenThietBi || tb.thietBi?.tenThietBi || tb.ThietBi?.TenThietBi || 'Thiết bị';
                const tinhTrang = tb.tinhTrang || tb.TinhTrang || 'MỚI';
                csvContent += `${r.soPhong},${r.tenLoaiPhong},${tenTb},${tinhTrang}\n`;
            });
        });
        const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bao_Cao_Thiet_Bi_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Đã xuất báo cáo CSV thành công!");
    };

    // XỬ LÝ KHO
    const handleInvSubmit = async (e) => {
        e.preventDefault();
        if (invForm.tongSoLuong < 0) return toast.error("Số lượng không được âm!");
        const toastId = toast.loading('Đang lưu...');
        try {
            const payload = {
                tenThietBi: invForm.tenThietBi,
                tongSoLuong: parseInt(invForm.tongSoLuong),
                icon: invForm.icon || null
            };
            await equipmentService.create(payload);
            toast.success('Đã thêm danh mục!', { id: toastId });
            setIsInvModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi thêm danh mục', { id: toastId });
        }
    };

    const handleAddQuantity = async (id, currentQty) => {
        if (!id) return toast.error('Không tìm thấy mã thiết bị hợp lệ!');
        const toastId = toast.loading('Đang cập nhật kho...');
        try {
            await equipmentService.addQuantity(id, 1);
            toast.success('Đã nhập thêm 1 sản phẩm vào kho!', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error('Lỗi cập nhật số lượng', { id: toastId });
        }
    };

    // XỬ LÝ PHÂN BỔ
    const openAssignModal = (actualRoomId, editItem = null) => {
        if (!actualRoomId) {
            console.error("Lỗi: Không tìm thấy ID phòng hợp lệ.");
            return toast.error('Lỗi dữ liệu phòng!');
        }

        setSelectedRoomId(actualRoomId);

        if (editItem) {
            setEditingTbpId(getAssignId(editItem));
            setAssignForm({ 
                maThietBi: getInvId(editItem) || getInvId(editItem.thietBi) || editItem.thietBiId, 
                tinhTrang: editItem.tinhTrang || editItem.TinhTrang || 'MỚI'
            });
        } else {
            setEditingTbpId(null);
            const firstAvailable = inventory.find(inv => inv.tongSoLuong > 0);
            setAssignForm({ 
                maThietBi: firstAvailable ? getInvId(firstAvailable) : '', 
                tinhTrang: 'MỚI' 
            });
        }
        setIsAssignModalOpen(true);
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading('Đang xử lý...');
        try {
            if (editingTbpId) {
                const updatePayload = { tinhTrang: assignForm.tinhTrang };
                await equipmentService.updateAssign(editingTbpId, updatePayload);
                toast.success('Cập nhật trạng thái thành công!', { id: toastId });
            } else {
                const assignPayload = {
                    phongId: selectedRoomId, 
                    thietBiId: assignForm.maThietBi,
                    tinhTrang: assignForm.tinhTrang
                };
                await equipmentService.assign(assignPayload);
                toast.success('Đã gắn thiết bị vào phòng!', { id: toastId });
            }
            setIsAssignModalOpen(false);
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.title || error.response?.data || 'Lỗi xử lý!';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Kiểm tra lại dữ liệu gửi lên', { id: toastId });
        }
    };

    const requestDeleteEquipment = (actualAssignId, tenTb) => {
        if (!actualAssignId) return toast.error('Không tìm thấy ID bản ghi phân bổ!');
        setItemToDelete({ id: actualAssignId, ten: tenTb });
        setIsConfirmOpen(true);
    };

    const confirmDelete = async () => {
        setIsConfirmOpen(false);
        try {
            await equipmentService.deleteAssign(itemToDelete.id);
            toast.success(`Đã gỡ "${itemToDelete.ten}" khỏi phòng`);
            fetchData();
        } catch (error) {
            toast.error('Lỗi khi gỡ thiết bị!');
        }
    };

    // UI HELPERS
    const getStatusStyle = (status) => {
        switch(status?.toUpperCase()) {
            case 'MỚI': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            case 'TỐT': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'HỎNG': return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };
    const getRoomStatusStyle = (status) => status === 'Sẵn sàng' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'; 

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div></div>
                <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </span>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-[#344054] outline-none shadow-sm" 
                        placeholder="Tìm kiếm thiết bị hoặc phòng..." />
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* CỘT TRÁI: KHO THIẾT BỊ */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Kho Thiết Bị</h2>
                        <button onClick={() => {setInvForm({ tenThietBi: '', tongSoLuong: '', icon: 'TV' }); setIsInvModalOpen(true);}} 
                            className="text-xs font-bold text-gray-500 hover:text-[#344054] uppercase tracking-wide flex items-center gap-1">
                            + Thêm danh mục
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex-1 flex flex-col min-h-[500px]">
                        <div className="flex-1 space-y-1">
                            {isLoading ? <p className="p-4 text-sm text-gray-500 text-center">Đang tải...</p> : 
                            currentInventory.length === 0 ? <p className="p-4 text-sm text-gray-500 text-center">Kho trống.</p> :
                            currentInventory.map((inv, idx) => {
                                const actualInvId = getInvId(inv);
                                const invKey = actualInvId || `inv-${idx}`; 
                                
                                return (
                                    <div key={invKey} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition group">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">{inv.tenThietBi}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">Tồn kho: {inv.tongSoLuong} chiếc</p>
                                        </div>
                                        <button 
                                            onClick={() => handleAddQuantity(actualInvId, inv.tongSoLuong)} 
                                            title="Nhập thêm 1 thiết bị vào kho"
                                            className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm border border-blue-100">
                                            +
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {totalInvPages > 0 && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-3 px-2 mt-2">
                                <button onClick={() => setInvCurrentPage(p => Math.max(1, p - 1))} disabled={invCurrentPage === 1}
                                    className={`p-1 rounded ${invCurrentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <span className="text-xs text-gray-500 font-medium">{invCurrentPage} / {totalInvPages}</span>
                                <button onClick={() => setInvCurrentPage(p => Math.min(totalInvPages, p + 1))} disabled={invCurrentPage === totalInvPages}
                                    className={`p-1 rounded ${invCurrentPage === totalInvPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* CỘT PHẢI: TRẠNG THÁI THIẾT BỊ PHÒNG */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-extrabold text-gray-900">Trạng Thái Thiết Bị Phòng</h2>
                            <p className="text-sm text-gray-500 mt-1">Giám sát phần cứng và phân bổ thiết bị theo thời gian thực.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleGenerateCSV} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm">
                                Lập báo cáo CSV
                            </button>
                            <button onClick={handleExportJSON} className="bg-[#344054] hover:bg-[#1d2939] text-white font-medium px-4 py-2 rounded-lg text-sm transition flex items-center gap-2 shadow-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                Xuất File JSON
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[500px]">
                        {currentRooms.length === 0 ? (
                            <div className="col-span-2 text-center text-gray-500 mt-10">Không tìm thấy phòng nào.</div>
                        ) : (
                            currentRooms.map((room, roomIdx) => {
                                const actualRoomId = getRoomId(room); 
                                const roomKey = actualRoomId || `room-${roomIdx}`; 
                                
                                // ĐÃ FIX: Hỗ trợ tìm kiếm field "equipments"
                                const thietBisList = room.equipments || room.Equipments || room.thietBis || room.ThietBis || room.thietBiPhongs || room.ThietBiPhongs || [];   
                                
                                return (
                                    <div key={roomKey} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-gray-50 text-gray-800 text-xl font-black w-14 h-14 rounded-xl flex items-center justify-center border border-gray-100">
                                                    {room.soPhong}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-900">{room.tenLoaiPhong}</h3>
                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-0.5">TẦNG {room.tang}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${getRoomStatusStyle(room.trangThai)}`}>
                                                {room.trangThai}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-4 mb-6">
                                            {thietBisList.length === 0 ? (
                                                <p className="text-sm text-gray-400 italic">Phòng này chưa có thiết bị.</p>
                                            ) : (
                                                thietBisList.map((tb, tbIdx) => {
                                                    const actualAssignId = getAssignId(tb);
                                                    const tbKey = actualAssignId || `tb-${tbIdx}`; 
                                                    
                                                    // ĐÃ FIX: Lấy tên thiết bị chuẩn từ JSON mới
                                                    const tenThietBi = tb.tenThietBi || tb.thietBi?.tenThietBi || tb.ThietBi?.TenThietBi || 'Thiết bị';
                                                    const tinhTrang = tb.tinhTrang || tb.TinhTrang || 'MỚI';
                                                    
                                                    return (
                                                        <div key={tbKey} className="flex items-center justify-between group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-gray-400">
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-800">{tenThietBi}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getStatusStyle(tinhTrang)}`}>
                                                                    {tinhTrang}
                                                                </span>
                                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition">
                                                                    <button onClick={() => openAssignModal(actualRoomId, tb)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                                                                    <button onClick={() => requestDeleteEquipment(actualAssignId, tenThietBi)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        <button onClick={() => openAssignModal(actualRoomId)} 
                                            className="w-full bg-gray-50 hover:bg-gray-100 text-[#344054] font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition border border-gray-100">
                                            + Thêm Thiết Bị
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {totalPages > 0 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                            <span className="text-sm text-gray-500">Hiển thị trang {currentPage} / {totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${currentPage === 1 ? 'border-gray-100 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>Trang trước</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${currentPage === totalPages ? 'border-gray-100 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>Trang tiếp</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: THÊM TỒN KHO */}
            {isInvModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Thêm Danh Mục Kho</h3>
                        <form onSubmit={handleInvSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tên thiết bị</label>
                                <input type="text" placeholder="VD: Tủ lạnh Mini Aqua 50L" required value={invForm.tenThietBi} onChange={e => setInvForm({...invForm, tenThietBi: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344054]" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Số lượng nhập ban đầu</label>
                                <input type="number" placeholder="0" required min="0" value={invForm.tongSoLuong} onChange={e => setInvForm({...invForm, tongSoLuong: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344054]" />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsInvModalOpen(false)} className="flex-1 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition">Hủy</button>
                                <button type="submit" className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white py-2.5 rounded-lg text-sm font-medium transition">Lưu danh mục</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: PHÂN BỔ THIẾT BỊ VÀO PHÒNG */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-[#101828]/60 z-50 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">{editingTbpId ? 'Cập Nhật Tình Trạng' : 'Phân Bổ Thiết Bị'}</h3>
                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                            {!editingTbpId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Chọn thiết bị từ kho</label>
                                    <select required value={assignForm.maThietBi} onChange={e => setAssignForm({...assignForm, maThietBi: e.target.value})} 
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344054]">
                                        <option value="" disabled>-- Chọn thiết bị --</option>
                                        {inventory.map((inv, invIdx) => {
                                            const actualInvId = getInvId(inv);
                                            const invKey = actualInvId || `select-inv-${invIdx}`;
                                            return (
                                                <option 
                                                    key={invKey} 
                                                    value={actualInvId} 
                                                    disabled={inv.tongSoLuong <= 0}
                                                >
                                                    {inv.tenThietBi} {inv.tongSoLuong <= 0 ? '(Hết hàng)' : `(Còn ${inv.tongSoLuong})`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tình trạng phần cứng</label>
                                <select value={assignForm.tinhTrang} onChange={e => setAssignForm({...assignForm, tinhTrang: e.target.value})} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#344054]">
                                    <option value="MỚI">MỚI (Thiết bị mới)</option>
                                    <option value="TỐT">TỐT (Đang hoạt động bình thường)</option>
                                    <option value="HỎNG">HỎNG (Cần sửa chữa/Thay thế)</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 border border-gray-200 hover:bg-gray-50 py-2.5 rounded-lg text-sm font-medium transition">Hủy</button>
                                <button type="submit" className="flex-1 bg-[#344054] hover:bg-[#1d2939] text-white py-2.5 rounded-lg text-sm font-medium transition">Xác nhận</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={isConfirmOpen} title="Gỡ thiết bị" message={`Xác nhận gỡ "${itemToDelete?.ten}" khỏi phòng này?`} onConfirm={confirmDelete} onCancel={() => setIsConfirmOpen(false)} />
        </AdminLayout>
    );
}
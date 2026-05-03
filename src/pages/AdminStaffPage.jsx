
import { useState, useEffect, useMemo, useCallback } from 'react';
import { adminSystemService } from '../services/admin.system.service';

// ─── Constants ────────────────────────────────────────────────────
const STAFF_ROLES = ['SuperAdmin', 'Receptionist', 'Housekeeper'];
const CUSTOMER_ROLES = ['Customer', 'Khách hàng'];
const PAGE_SIZE = 10;

const ROLE_COLORS = {
  SuperAdmin: { bg: '#dbeafe', color: '#1d4ed8' },
  Receptionist: { bg: '#d1fae5', color: '#065f46' },
  Housekeeper: { bg: '#fef9c3', color: '#854d0e' },
};
const rStyle = (n) => ROLE_COLORS[n] ?? { bg: '#f3f4f6', color: '#374151' };

// Normalize bất kỳ shape response nào → string[]
const getRoleNames = (u) => {
  const arr = u?.roles ?? u?.vaiTros ?? [];
  if (!Array.isArray(arr)) return [];
  return arr.map(r => (typeof r === 'string' ? r : r.tenVaiTro ?? r.name ?? '')).filter(Boolean);
};

const isStaff = (u) => {
  const rn = getRoleNames(u);
  if (!rn.length) return false;               // user chưa có role → không hiện ở trang nhân sự
  const hasStaff = rn.some(n => STAFF_ROLES.includes(n));
  const hasCustomer = rn.some(n => CUSTOMER_ROLES.includes(n));
  return hasStaff && !hasCustomer;
};

const AC = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
const aClr = (s = '') => AC[s.charCodeAt(0) % AC.length];
const ini = (s = '') => s.trim().split(/\s+/).slice(-2).map(w => w[0] ?? '').join('').toUpperCase() || 'NV';

// ─────────────────────────────────────────────────────────────────
export default function AdminStaffPage() {
  // ── All staff (sau khi filter) ────────────────────────────────
  const [allStaff, setAllStaff] = useState([]);   // toàn bộ nhân sự đã filter
  const [allRoles, setAllRoles] = useState([]);   // từ GET /api/admin/roles
  const [globalLoad, setGlobalLoad] = useState(true); // loading lần đầu

  // ── Search + Client-side pagination ───────────────────────────
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // ── Detail panel ──────────────────────────────────────────────
  const [selected, setSelected] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [rLoad, setRLoad] = useState(false);

  // ── Modals ────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [cForm, setCForm] = useState({ tenDangNhap: '', hoTen: '', email: '', password: '', roleName: '' });
  const [cLoad, setCLoad] = useState(false);
  const [cErr, setCErr] = useState('');

  const [showAssign, setShowAssign] = useState(false);
  const [assignId, setAssignId] = useState(''); // UUID của role
  const [aLoad, setALoad] = useState(false);
  const [aErr, setAErr] = useState('');

  const [toast, setToast] = useState('');
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000); };

  // ── Fetch ALL users rồi filter ────────────────────────────────
  // Dùng pageSize lớn để lấy toàn bộ, vì API không có endpoint lọc theo role
  const fetchAll = useCallback(async () => {
    setGlobalLoad(true);
    try {
      const { data } = await adminSystemService.getUsers({
        pageIndex: 1,
        pageSize: 1000,   // ← lấy toàn bộ, phân trang client-side
        // keyword không truyền ở đây để search client-side (chính xác hơn)
      });
      const items = Array.isArray(data) ? data
        : Array.isArray(data?.items) ? data.items
          : Array.isArray(data?.data) ? data.data
            : [];
      setAllStaff(items.filter(isStaff));
    } catch (e) {
      console.error('[Staff] fetchAll:', e);
      setAllStaff([]);
    } finally {
      setGlobalLoad(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await adminSystemService.getRoles();
      setAllRoles(Array.isArray(data) ? data : []);
    } catch (e) { console.error('[Staff] fetchRoles:', e); }
  }, []);

  useEffect(() => { fetchAll(); fetchRoles(); }, [fetchAll, fetchRoles]);

  // ── Client-side search + paginate ─────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return allStaff;
    const q = search.toLowerCase();
    return allStaff.filter(u =>
      (u.hoTen ?? '').toLowerCase().includes(q) ||
      (u.tenDangNhap ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    );
  }, [allStaff, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset về trang 1 khi search thay đổi
  useEffect(() => { setPage(1); }, [search]);

  // ── Stats (tính từ allStaff – chỉ nhân sự) ───────────────────
  const stats = useMemo(() => ({
    total: allStaff.length,
    superAdmin: allStaff.filter(u => getRoleNames(u).includes('SuperAdmin')).length,
    receptionist: allStaff.filter(u => getRoleNames(u).includes('Receptionist')).length,
    housekeeper: allStaff.filter(u => getRoleNames(u).includes('Housekeeper')).length,
  }), [allStaff]);

  // ── Xem vai trò nhân viên ─────────────────────────────────────
  const selectUser = async (u) => {
    setSelected(u);
    setRLoad(true);
    try {
      const { data } = await adminSystemService.getUserRoles(u.id);
      setUserRoles(Array.isArray(data) ? data : []);
    } catch (e) { console.error('[Staff] getUserRoles:', e); setUserRoles([]); }
    finally { setRLoad(false); }
  };

  // ── Tạo tài khoản ────────────────────────────────────────────
  // AdminCreateUserVM: roleName = STRING tên vai trò
  const handleCreate = async () => {
    const { tenDangNhap, hoTen, email, password, roleName } = cForm;
    if (!tenDangNhap.trim()) return setCErr('Tên đăng nhập không được để trống.');
    if (!hoTen.trim()) return setCErr('Họ và tên không được để trống.');
    if (!email.trim()) return setCErr('Email không được để trống.');
    if (password.length < 6) return setCErr('Mật khẩu tối thiểu 6 ký tự.');
    if (!roleName) return setCErr('Vui lòng chọn vai trò.');

    setCErr(''); setCLoad(true);
    try {
      await adminSystemService.createUser({
        tenDangNhap: tenDangNhap.trim(),
        hoTen: hoTen.trim(),
        email: email.trim(),
        password,
        roleName,   // STRING tên, không phải UUID
      });
      setShowCreate(false);
      setCForm({ tenDangNhap: '', hoTen: '', email: '', password: '', roleName: '' });
      showToast('✓ Tạo tài khoản thành công!');
      fetchAll();
    } catch (e) {
      setCErr(
        e.response?.data?.message
        ?? (Array.isArray(e.response?.data) ? Object.values(e.response.data).flat().join(', ') : null)
        ?? e.response?.data
        ?? 'Tạo tài khoản thất bại.'
      );
    } finally { setCLoad(false); }
  };

  // ── Gán vai trò ──────────────────────────────────────────────
  // AssignUserRoleVM: { nguoiDungId: uuid, vaiTroIds: uuid[] }
  const handleAssign = async () => {
    if (!assignId || !selected) return;
    setAErr(''); setALoad(true);
    try {
      await adminSystemService.assignRoles({
        nguoiDungId: selected.id,
        vaiTroIds: [assignId], // mảng UUID
      });
      setShowAssign(false); setAssignId('');
      showToast('✓ Gán vai trò thành công!');
      selectUser(selected); // refresh role list
      fetchAll();
    } catch (e) {
      setAErr(e.response?.data?.message ?? 'Gán vai trò thất bại.');
    } finally { setALoad(false); }
  };

  // ── Xóa tài khoản ────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Xác nhận xóa tài khoản này khỏi hệ thống?')) return;
    try {
      await adminSystemService.deleteUser(id);
      if (selected?.id === id) setSelected(null);
      showToast('✓ Đã xóa tài khoản.');
      fetchAll();
    } catch (e) {
      window.alert(e.response?.data?.message ?? 'Xóa tài khoản thất bại.');
    }
  };

  // Chỉ hiện role nhân sự trong dropdown
  const staffRoleOpts = allRoles.filter(r => STAFF_ROLES.includes(r.tenVaiTro ?? r.name ?? ''));

  // Normalize userRoles để hiển thị
  const dispRoles = userRoles.length > 0
    ? userRoles.map(r => ({ id: r.id ?? '', name: r.tenVaiTro ?? r.name ?? String(r) }))
    : getRoleNames(selected ?? {}).map(n => ({ id: '', name: n }));

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Stats – chỉ tính nhân sự nội bộ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Tổng nhân sự', value: stats.total, color: '#1d4ed8' },
          { label: 'Super Admin', value: stats.superAdmin, color: '#7c3aed' },
          { label: 'Lễ tân', value: stats.receptionist, color: '#065f46' },
          { label: 'Trực buồng', value: stats.housekeeper, color: '#92400e' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{s.label}</p>
            <p className="text-3xl font-black" style={{ color: s.color }}>
              {globalLoad ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Main */}
      <div className="flex gap-6 flex-1 min-h-0">

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 gap-4 flex-wrap shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Danh sách nhân sự</h2>
              <p className="text-xs text-gray-400 mt-0.5">SuperAdmin · Lễ tân · Trực buồng</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text" placeholder="Tìm kiếm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 w-52"
                />
              </div>
              <button
                onClick={() => { setShowCreate(true); setCErr(''); setCForm({ tenDangNhap: '', hoTen: '', email: '', password: '', roleName: '' }); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition"
                style={{ background: '#1e3a5f' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Thêm nhân sự
              </button>
            </div>
          </div>

          {/* Table body */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nhân viên', 'Email', 'Tên đăng nhập', 'Vai trò', 'Thao tác'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {globalLoad ? (
                  <tr><td colSpan={5} className="py-20 text-center text-gray-400">Đang tải...</td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-gray-400">
                    {search ? `Không tìm thấy "${search}"` : 'Không có nhân viên nào.'}
                  </td></tr>
                ) : pageItems.map(u => {
                  const rn = getRoleNames(u);
                  return (
                    <tr key={u.id}
                      onClick={() => selectUser(u)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${selected?.id === u.id ? 'bg-blue-50' : 'hover:bg-gray-50/70'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                            style={{ background: aClr(u.hoTen ?? u.tenDangNhap ?? '') }}>
                            {ini(u.hoTen ?? u.tenDangNhap ?? '')}
                          </div>
                          <p className="font-semibold text-gray-900">{u.hoTen ?? u.tenDangNhap ?? '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{u.email ?? '—'}</td>
                      <td className="px-5 py-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {u.tenDangNhap ?? '—'}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {rn.length > 0
                            ? rn.map(r => (
                              <span key={r} className="text-xs font-bold px-2.5 py-1 rounded-full" style={rStyle(r)}>{r}</span>
                            ))
                            : <span className="text-xs text-gray-300 italic">—</span>
                          }
                        </div>
                      </td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <BtnAction title="Xem" hoverCls="hover:bg-blue-50 hover:text-blue-600" onClick={() => selectUser(u)}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </BtnAction>
                          <BtnAction title="Gán vai trò" hoverCls="hover:bg-purple-50 hover:text-purple-600"
                            onClick={() => { selectUser(u); setShowAssign(true); setAssignId(''); setAErr(''); }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </BtnAction>
                          <BtnAction title="Xóa" hoverCls="hover:bg-red-50 hover:text-red-500" onClick={() => handleDelete(u.id)}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </BtnAction>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination – hoàn toàn client-side */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 shrink-0 text-xs text-gray-500">
            <span>
              Hiển thị {pageItems.length > 0 ? (safePage - 1) * PAGE_SIZE + 1 : 0}–{(safePage - 1) * PAGE_SIZE + pageItems.length} / {filtered.length} nhân viên
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 font-medium">
                Trước
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                // Hiện trang xung quanh trang hiện tại
                const start = Math.max(1, safePage - 3);
                const n = start + i;
                return n <= totalPages ? n : null;
              }).filter(Boolean).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className={`px-3 py-1.5 rounded border font-medium ${safePage === n ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 hover:bg-white'}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                className="px-3 py-1.5 rounded border border-gray-200 hover:bg-white disabled:opacity-40 font-medium">
                Tiếp
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="px-5 py-5 shrink-0" style={{ background: 'linear-gradient(135deg,#1e3a5f,#2563eb)' }}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">Hồ sơ nhân viên</span>
                <button onClick={() => setSelected(null)} className="text-blue-200 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
                  style={{ background: aClr(selected.hoTen ?? '') }}>
                  {ini(selected.hoTen ?? selected.tenDangNhap ?? '')}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-bold truncate">{selected.hoTen ?? selected.tenDangNhap}</p>
                  <p className="text-blue-200 text-xs truncate">{selected.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-5 space-y-5">
              <InfoBlock title="Thông tin tài khoản">
                {[
                  ['Tên đăng nhập', selected.tenDangNhap],
                  ['Email', selected.email],
                  ['Họ và tên', selected.hoTen],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-xs font-semibold text-gray-700 max-w-[160px] text-right truncate">{v ?? '—'}</span>
                  </div>
                ))}
              </InfoBlock>

              <InfoBlock title="Vai trò đang đảm nhiệm">
                {rLoad ? <p className="text-xs text-gray-400 py-2">Đang tải...</p>
                  : dispRoles.length > 0 ? dispRoles.map((r, i) => {
                    const st = rStyle(r.name);
                    return (
                      <div key={i} className="flex items-center gap-2 mb-2 px-3 py-2.5 rounded-lg border"
                        style={{ background: st.bg, borderColor: `${st.color}30` }}>
                        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" style={{ color: st.color }}>
                          <path d="M12 1l3.09 6.26L22 8.27l-5 4.87 1.18 6.88L12 16.77l-6.18 3.25L7 13.14 2 8.27l6.91-1.01L12 1z" />
                        </svg>
                        <span className="text-xs font-bold" style={{ color: st.color }}>{r.name}</span>
                      </div>
                    );
                  }) : <p className="text-xs text-gray-300 italic py-2">Chưa có vai trò</p>}
              </InfoBlock>
            </div>

            <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">
              <button
                onClick={() => { setShowAssign(true); setAssignId(''); setAErr(''); }}
                className="w-full py-2.5 text-sm font-bold rounded-lg text-white hover:opacity-90"
                style={{ background: '#7c3aed' }}>
                Gán / Đổi vai trò
              </button>
              <button onClick={() => handleDelete(selected.id)}
                className="w-full py-2.5 text-sm font-bold rounded-lg text-red-500 border border-red-200 hover:bg-red-50">
                Xóa tài khoản
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: Tạo tài khoản ────────────────────────────────── */}
      {showCreate && (
        <Modal title="Tạo tài khoản nhân sự mới" onClose={() => setShowCreate(false)}>
          {cErr && <ErrBox msg={cErr} />}
          <div className="space-y-4">
            {[
              { k: 'tenDangNhap', label: 'Tên đăng nhập *', type: 'text' },
              { k: 'hoTen', label: 'Họ và tên *', type: 'text' },
              { k: 'email', label: 'Email *', type: 'email' },
              { k: 'password', label: 'Mật khẩu * (tối thiểu 6)', type: 'password' },
            ].map(({ k, label, type }) => (
              <div key={k}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} value={cForm[k]}
                  onChange={e => setCForm(p => ({ ...p, [k]: e.target.value }))}
                  className="w-full border border-gray-300 bg-gray-50 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition" />
              </div>
            ))}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Vai trò ban đầu *
                <span className="normal-case font-normal text-blue-400 ml-1">(gửi string tên, không phải UUID)</span>
              </label>
              <select value={cForm.roleName} onChange={e => setCForm(p => ({ ...p, roleName: e.target.value }))}
                className="w-full border border-gray-300 bg-gray-50 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:bg-white">
                <option value="">-- Chọn vai trò --</option>
                {staffRoleOpts.map(r => (
                  <option key={r.id} value={r.tenVaiTro ?? r.name}>{r.tenVaiTro ?? r.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowCreate(false)}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
            <button onClick={handleCreate} disabled={cLoad}
              className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white disabled:opacity-60"
              style={{ background: '#1e3a5f' }}>
              {cLoad ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: Gán vai trò ──────────────────────────────────── */}
      {showAssign && selected && (
        <Modal title={`Gán vai trò: ${selected.hoTen ?? selected.tenDangNhap}`} onClose={() => setShowAssign(false)}>
          <p className="text-sm text-gray-500 mb-4">Chọn vai trò mới (UUID sẽ được gửi lên server).</p>
          {aErr && <ErrBox msg={aErr} />}
          <div className="space-y-2">
            {staffRoleOpts.length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">Không có vai trò nào.</p>
              : staffRoleOpts.map(r => {
                const rn = r.tenVaiTro ?? r.name ?? '';
                const st = rStyle(rn);
                const sel = assignId === r.id;
                return (
                  <label key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition ${sel ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" name="ar" value={r.id} checked={sel}
                      onChange={() => setAssignId(r.id)} className="hidden" />
                    <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: sel ? '#2563eb' : '#d1d5db', background: sel ? '#2563eb' : 'transparent' }}>
                      {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={st}>{rn}</span>
                    <span className="text-[10px] text-gray-300 ml-auto">...{r.id?.slice(-6)}</span>
                  </label>
                );
              })}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowAssign(false)}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
            <button onClick={handleAssign} disabled={!assignId || aLoad}
              className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white disabled:opacity-60"
              style={{ background: '#7c3aed' }}>
              {aLoad ? 'Đang lưu...' : 'Xác nhận gán'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
function InfoBlock({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</p>
      {children}
    </div>
  );
}
function ErrBox({ msg }) {
  return <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4">{msg}</div>;
}
function BtnAction({ title, hoverCls, onClick, children }) {
  return (
    <button title={title} onClick={onClick} className={`p-1.5 rounded-lg text-gray-400 transition ${hoverCls}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{children}</svg>
    </button>
  );
}
/**
 * AdminRolesPage.jsx
 *
 * ── PHÂN TÍCH BACKEND ──────────────────────────────────────────────
 *
 * GET /api/admin/permissions
 *   → List<ChucNangTreeVM>  ← KHÔNG phải flat list, là cây phân cấp!
 *   [
 *     { id: "uuid", tenChucNang: "Booking", quyens: [
 *         { id: "uuid1", tenQuyen: "View",   giaTriQuyen: "Booking.View"   },
 *         { id: "uuid2", tenQuyen: "Create", giaTriQuyen: "Booking.Create" },
 *         ...
 *     ]},
 *     { id: "uuid", tenChucNang: "RoomStatus", quyens: [
 *         { id: "uuid3", tenQuyen: "View", giaTriQuyen: "RoomStatus.View" },
 *         { id: "uuid4", tenQuyen: "Edit", giaTriQuyen: "RoomStatus.Edit" },
 *         // Không có Create / Delete cho RoomStatus!
 *     ]},
 *     ...
 *   ]
 *
 * GET /api/admin/roles/{id}/permissions
 *   → Guid[]   ← Mảng UUID THUẦN, KHÔNG phải object!
 *   ["uuid1", "uuid2", "uuid3"]
 *
 * POST /api/admin/roles/assign-permissions
 *   Body: AssignRolePermissionVM { vaiTroId: Guid, quyenIds: Guid[] }
 *         (C# PascalCase → JSON camelCase: vaiTroId, quyenIds)
 *
 * GET /api/admin/roles
 *   → [{ id: Guid, tenVaiTro: string }]
 *
 * POST /api/admin/roles
 *   Body: CreateRoleVM { tenVaiTro: string }
 *
 * ── THIẾT KẾ MA TRẬN ───────────────────────────────────────────────
 * Rows    = ChucNang (Function group): Booking, Room, User, ...
 * Columns = Actions: Xem | Tạo | Sửa | Xóa | (các action đặc biệt)
 * Cell    = checkbox, hiện nếu ChucNang đó có action tương ứng
 *           checked  = quyenId nằm trong Set từ GET .../permissions
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminSystemService } from '../services/admin.system.service';

// ── Cột action chuẩn ─────────────────────────────────────────────
// Thứ tự: Xem → Tạo → Sửa → Xóa → các action đặc biệt
const STD_ACTIONS = ['View', 'Create', 'Edit', 'Delete'];

const ACTION_LABEL = {
  View: 'Xem',
  Create: 'Tạo',
  Edit: 'Sửa',
  Delete: 'Xóa',
  // Các action đặc biệt từ AppPermissions.cs
  UnknownCreate: 'Tạo KH',   // Booking.UnknownCreate
  AddService: 'Thêm DV',  // Bill.AddService
  BookingHistory: 'Lịch sử',  // Profile.BookingHistory
  CheckIn: 'Check-in', // Reception.CheckIn
  CheckOut: 'Check-out',// Reception.CheckOut
  ReportDamage: 'Báo hỏng', // Housekeeping.ReportDamage
};

// Lấy tên action từ giaTriQuyen (VD: "Booking.Create" → "Create")
const getAction = (giaTriQuyen = '') => {
  const parts = giaTriQuyen.split('.');
  return parts.length >= 2 ? parts.slice(1).join('.') : giaTriQuyen;
};

// Màu badge cho role
const ROLE_COLORS = ['#1d4ed8', '#7c3aed', '#065f46', '#854d0e', '#be185d', '#0e7490'];

// Icon module
const MODULE_ICONS = {
  Function: '⚙️', User: '👥', Role: '🔐',
  Room: '🛏️', PricingPolicy: '💰', RoomType: '🏷️',
  Service: '☕', Equipment: '🔧', RoomStatus: '📋',
  Booking: '📅', Bill: '💳', Profile: '👤',
  Reception: '🏨', Housekeeping: '🧹',
};
const getIcon = (name) => MODULE_ICONS[name] ?? '📌';

// Tên tiếng Việt cho module
const MODULE_VI = {
  Function: 'Chức năng', User: 'Người dùng',
  Role: 'Vai trò', Room: 'Phòng',
  PricingPolicy: 'Chính sách giá', RoomType: 'Loại phòng',
  Service: 'Dịch vụ', Equipment: 'Thiết bị',
  RoomStatus: 'Trạng thái phòng', Booking: 'Đặt phòng',
  Bill: 'Hóa đơn', Profile: 'Hồ sơ',
  Reception: 'Lễ tân', Housekeeping: 'Trực buồng',
};
const getModuleVI = (name) => MODULE_VI[name] ?? name;

// ── IndeterminateCheckbox ─────────────────────────────────────────
function ICheck({ checked, indeterminate, onChange, size = 'md' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.checked = !!checked;
    ref.current.indeterminate = !!indeterminate;
  });
  const cls = size === 'lg'
    ? 'w-5 h-5 cursor-pointer accent-blue-700 shrink-0'
    : 'w-4 h-4 cursor-pointer accent-blue-700 shrink-0';
  return <input ref={ref} type="checkbox" onChange={onChange} className={cls} />;
}

// ═══════════════════════════════════════════════════════════════════
export default function AdminRolesPage() {
  // ── Dữ liệu ─────────────────────────────────────────────────────
  const [roles, setRoles] = useState([]);  // [{ id, tenVaiTro }]
  const [tree, setTree] = useState([]);  // ChucNangTreeVM[] đã dedup theo giaTriQuyen

  // Bảng ánh xạ: bất kỳ UUID (cũ hay mới) dạng lowercase → canonicalId gốc
  const [permIdMap, setPermIdMap] = useState(new Map()); // Map<lowercaseUUID, canonicalId>

  // ── Selection ────────────────────────────────────────────────────
  const [selRole, setSelRole] = useState(null);

  // Danh sách UUID quyền thô của vai trò đang chọn từ server (có thể có cả UUID cũ & mới)
  const [rawRolePerms, setRawRolePerms] = useState([]);

  // Set<canonicalId> – chứa các QuyenId đang được tick cho role đang chọn
  const [ticked, setTicked] = useState(new Set());

  // ── Loading / status ─────────────────────────────────────────────
  const [rolesLoading, setRolesLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(true);
  const [matLoading, setMatLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState({ msg: '', ok: true });

  // ── Modal tạo role mới ────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  // ── Load roles ───────────────────────────────────────────────────
  // const loadRoles = useCallback(async () => {
  //   setRolesLoading(true);
  //   try {
  //     const { data } = await adminSystemService.getRoles();
  //     const list = Array.isArray(data) ? data : [];
  //     setRoles(list);
  //     // Tự chọn role đầu tiên nếu chưa có
  //     if (list.length > 0) setSelRole(r => r ?? list[0]);
  //   } catch (e) {
  //     console.error('[Roles] loadRoles:', e);
  //   } finally {
  //     setRolesLoading(false);
  //   }
  // }, []);
  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const { data } = await adminSystemService.getRoles();
      const list = Array.isArray(data) ? data : [];

      // KHỬ TRÙNG LẶP: Chỉ giữ lại role xuất hiện ĐẦU TIÊN theo tenVaiTro
      const uniqueRoles = list.reduce((acc, current) => {
        // Nếu acc chưa có role này thì mới push vào
        if (!acc.some(r => r.tenVaiTro === current.tenVaiTro)) {
          acc.push(current);
        }
        return acc;
      }, []);

      setRoles(uniqueRoles);

      // Tự chọn role đầu tiên trong danh sách đã lọc nếu chưa có
      if (uniqueRoles.length > 0) setSelRole(r => r ?? uniqueRoles[0]);
    } catch (e) {
      console.error('[Roles] loadRoles:', e);
    } finally {
      setRolesLoading(false);
    }
  }, []);
  // ── Load cây permission (ChucNangTreeVM[]) ───────────────────────
  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const { data } = await adminSystemService.getPermissions();
      // Đảm bảo đúng shape: [{ id, tenChucNang, quyens: [{id, tenQuyen, giaTriQuyen}] }]
      const rawList = Array.isArray(data) ? data : [];

      const anyIdToCanonicalId = new Map(); // bất kỳ UUID nào dạng lowercase → canonicalId gốc
      const globalSeenActions = new Map(); // giaTriQuyen → QuyenItem (canonical)

      // 1. Quét toàn bộ quyền để xác định canonicalId cho từng giaTriQuyen và build bảng ánh xạ
      rawList.forEach(cn => {
        if (Array.isArray(cn.quyens)) {
          cn.quyens.forEach(q => {
            const key = q.giaTriQuyen;
            const qIdLower = q.id.toLowerCase();
            if (!globalSeenActions.has(key)) {
              globalSeenActions.set(key, q);
              anyIdToCanonicalId.set(qIdLower, q.id); // canonical -> chính nó
            } else {
              const canonicalQuyen = globalSeenActions.get(key);
              anyIdToCanonicalId.set(qIdLower, canonicalQuyen.id); // map duplicate -> canonical
            }
          });
        }
      });

      // 2. Lọc danh sách quyền chỉ giữ lại các canonicalId tương ứng
      const dedupedList = rawList.map(cn => {
        const canonicalQuyens = [];
        if (Array.isArray(cn.quyens)) {
          cn.quyens.forEach(q => {
            const key = q.giaTriQuyen;
            if (globalSeenActions.get(key)?.id === q.id) {
              canonicalQuyens.push(q);
            }
          });
        }
        return { ...cn, quyens: canonicalQuyens };
      });

      // 3. Lọc bỏ các nhóm chức năng trùng tên hoặc rỗng
      const seenModules = new Set();
      const finalList = dedupedList.filter(cn => {
        if (seenModules.has(cn.tenChucNang)) return false;
        if (cn.quyens.length === 0) return false;
        seenModules.add(cn.tenChucNang);
        return true;
      });

      setTree(finalList);
      setPermIdMap(anyIdToCanonicalId);
    } catch (e) {
      console.error('[Roles] loadTree:', e);
    } finally {
      setTreeLoading(false);
    }
  }, []);


  // ── Load QuyenId[] của role đang chọn ───────────────────────────
  // Backend trả Guid[] thuần – KHÔNG phải object!
  const loadRolePerms = useCallback(async (roleId) => {
    setMatLoading(true);
    setDirty(false);
    try {
      const { data } = await adminSystemService.getRolePermissions(roleId);
      // data = ["uuid1", "uuid2", ...] (Guid string[])
      const arr = Array.isArray(data) ? data : [];
      setRawRolePerms(arr);
    } catch (e) {
      console.error('[Roles] loadRolePerms:', e);
      setRawRolePerms([]);
    } finally {
      setMatLoading(false);
    }
  }, []);

  // Cập nhật và resolve danh sách quyền đã tick khi rawRolePerms hoặc permIdMap thay đổi
  // Lọc bỏ các UUID không hợp lệ/không tồn tại trong tree hiện tại để tổng số quyền được gán chính xác
  useEffect(() => {
    const resolved = new Set();
    rawRolePerms.forEach(id => {
      if (typeof id === 'string') {
        const idLower = id.toLowerCase();
        const canonicalId = permIdMap.get(idLower);
        if (canonicalId) {
          resolved.add(canonicalId);
        }
      }
    });
    setTicked(resolved);
  }, [rawRolePerms, permIdMap]);

  // Khởi tạo
  useEffect(() => { loadRoles(); loadTree(); }, [loadRoles, loadTree]);

  // Khi chọn role → load perms của role đó
  useEffect(() => {
    if (selRole?.id) loadRolePerms(selRole.id);
  }, [selRole?.id, loadRolePerms]);

  // ── Toggle 1 permission ──────────────────────────────────────────
  const toggle = useCallback((id) => {
    setDirty(true);
    setTicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Toggle cả nhóm ChucNang ──────────────────────────────────────
  const toggleChucNang = useCallback((quyens, shouldCheck) => {
    setDirty(true);
    setTicked(prev => {
      const next = new Set(prev);
      quyens.forEach(q => shouldCheck ? next.add(q.id) : next.delete(q.id));
      return next;
    });
  }, []);

  // ── Toggle tất cả ───────────────────────────────────────────────
  const toggleAll = useCallback((shouldCheck) => {
    setDirty(true);
    if (shouldCheck) {
      const allIds = tree.flatMap(cn => cn.quyens.map(q => q.id));
      setTicked(new Set(allIds));
    } else {
      setTicked(new Set());
    }
  }, [tree]);

  // ── Lưu phân quyền ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!selRole?.id) return;
    setSaving(true);
    setStatus({ msg: '', ok: true });
    try {
      // AssignRolePermissionVM: { vaiTroId: Guid, quyenIds: Guid[] }
      // ticked chứa canonicalId nên gửi thẳng lên backend
      await adminSystemService.assignRolePermissions({
        vaiTroId: selRole.id,
        quyenIds: Array.from(ticked),
      });
      setStatus({ msg: '✓ Lưu phân quyền thành công!', ok: true });
      setDirty(false);
      setRawRolePerms(Array.from(ticked));
      setTimeout(() => setStatus({ msg: '', ok: true }), 4000);
    } catch (e) {
      const msg = e?.response?.data?.message ?? e?.response?.data ?? 'Lỗi không xác định';
      setStatus({ msg: `✗ ${msg}`, ok: false });
      console.error('[Roles] assignRolePermissions error:', e?.response?.data ?? e);
    } finally {
      setSaving(false);
    }
  };

  // ── Tạo role mới ─────────────────────────────────────────────────
  const handleCreateRole = async () => {
    if (!newName.trim()) { setCreateErr('Tên vai trò không được để trống.'); return; }
    setCreateErr(''); setCreating(true);
    try {
      // CreateRoleVM: { tenVaiTro: string }
      await adminSystemService.createRole({ tenVaiTro: newName.trim() });
      setShowCreate(false); setNewName('');
      await loadRoles();
    } catch (e) {
      setCreateErr(e?.response?.data?.message ?? 'Tạo vai trò thất bại.');
    } finally { setCreating(false); }
  };

  // ── Derived ──────────────────────────────────────────────────────
  const allQuyenIds = tree.flatMap(cn => cn.quyens.map(q => q.id));
  const totalPerms = allQuyenIds.length;
  const totalTicked = ticked.size;
  const allChecked = totalPerms > 0 && allQuyenIds.every(id => ticked.has(id));
  const someChecked = !allChecked && allQuyenIds.some(id => ticked.has(id));

  // Tập hợp tất cả action xuất hiện trong hệ thống (cho cột header)
  // Ưu tiên: View → Create → Edit → Delete → custom actions
  const allActions = (() => {
    const custom = new Set();
    tree.forEach(cn =>
      cn.quyens.forEach(q => {
        const act = getAction(q.giaTriQuyen);
        if (!STD_ACTIONS.includes(act)) custom.add(act);
      })
    );
    return [...STD_ACTIONS, ...custom];
  })();

  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-5 h-full min-h-0" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* ══ TRÁI: Danh sách vai trò ════════════════════════════════ */}
      <div className="w-60 shrink-0 flex flex-col min-h-0">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">

          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-gray-900">Vai trò hệ thống</span>
              {!rolesLoading && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  {roles.length} vai trò
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">Chọn vai trò để cấu hình quyền</p>
          </div>

          {/* Role list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {rolesLoading ? (
              <p className="text-xs text-center text-gray-400 py-10">Đang tải...</p>
            ) : roles.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-10">Chưa có vai trò nào.</p>
            ) : roles.map((r, i) => {
              const active = selRole?.id === r.id;
              const color = ROLE_COLORS[i % ROLE_COLORS.length];
              return (
                <button
                  key={r.id}
                  onClick={() => { if (!active) { setSelRole(r); setStatus({ msg: '', ok: true }); } }}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={active
                    ? { borderColor: color, background: `${color}10` }
                    : { borderColor: 'transparent' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = ''; }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: active ? color : '#1f2937' }}>
                        {r.tenVaiTro}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
                        ...{r.id?.slice(-8)}
                      </p>
                    </div>
                    {active && (
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor"
                        strokeWidth="2.5" viewBox="0 0 24 24" style={{ color }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tạo vai trò mới */}
          <div className="p-3 border-t border-gray-100 shrink-0">
            <button
              onClick={() => { setShowCreate(true); setCreateErr(''); setNewName(''); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium
                text-gray-400 border-2 border-dashed border-gray-200
                hover:border-blue-400 hover:text-blue-500 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tạo vai trò mới
            </button>
          </div>
        </div>
      </div>

      {/* ══ PHẢI: Ma trận phân quyền ════════════════════════════════ */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col min-h-0 overflow-hidden">

        {/* Chưa chọn role */}
        {!selRole ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-6xl mb-4">🔐</div>
            <p className="text-base font-semibold text-gray-600 mb-1">Chưa chọn vai trò</p>
            <p className="text-sm text-gray-400">Chọn một vai trò bên trái để cấu hình quyền hạn</p>
          </div>
        ) : (
          <>
            {/* Header ma trận */}
            <div className="px-6 py-5 border-b border-gray-100 shrink-0">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h2 className="text-xl font-black text-gray-900">{selRole.tenVaiTro}</h2>
                    {selRole.tenVaiTro === 'SuperAdmin' && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        MASTER
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Cấu hình quyền hạn trong hệ thống&nbsp;·&nbsp;
                    <span className="font-bold text-blue-600">{totalTicked}</span>
                    <span className="text-gray-400"> / {totalPerms} quyền đang được gán</span>
                  </p>
                  {status.msg && (
                    <p className={`text-xs font-semibold mt-1.5 ${status.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {status.msg}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {dirty && (
                    <button
                      onClick={() => { loadRolePerms(selRole.id); setStatus({ msg: '', ok: true }); }}
                      className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      Hoàn tác
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className="px-6 py-2.5 text-sm font-bold rounded-lg text-white transition disabled:cursor-not-allowed"
                    style={{ background: dirty && !saving ? '#1e3a5f' : '#9ca3af' }}
                  >
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>

            {/* Ma trận */}
            <div className="flex-1 overflow-auto">
              {(matLoading || treeLoading) ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <svg className="w-7 h-7 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="text-sm">Đang tải danh sách quyền...</span>
                </div>
              ) : tree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                  <div className="text-5xl mb-4">⚠️</div>
                  <p className="text-gray-600 font-semibold mb-2">Không tải được danh sách quyền</p>
                  <p className="text-xs text-gray-400 mb-4">
                    API <code className="bg-gray-100 px-1 rounded">GET /api/admin/permissions</code> trả về rỗng
                  </p>
                  <button onClick={loadTree}
                    className="px-6 py-2.5 text-sm font-bold rounded-lg text-white"
                    style={{ background: '#1e3a5f' }}>
                    Thử lại
                  </button>
                </div>
              ) : (
                <table className="w-full border-collapse">
                  {/* Table header */}
                  <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {/* Cột tên module + checkbox chọn tất cả */}
                      <th className="text-left px-5 py-3.5 w-56">
                        <div className="flex items-center gap-3">
                          <ICheck
                            checked={allChecked}
                            indeterminate={someChecked}
                            onChange={e => toggleAll(e.target.checked)}
                            size="lg"
                          />
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Nhóm chức năng
                          </span>
                        </div>
                      </th>

                      {/* Cột từng action */}
                      {allActions.map(action => (
                        <th key={action} className="text-center px-3 py-3.5 min-w-[72px]">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {ACTION_LABEL[action] ?? action}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tree.map((cn, idx) => {
                      // Map action → QuyenItemVM cho ChucNang này
                      const actionMap = {};
                      cn.quyens.forEach(q => {
                        const act = getAction(q.giaTriQuyen);
                        actionMap[act] = q;
                      });

                      const allCnChecked = cn.quyens.every(q => ticked.has(q.id));
                      const someCnChecked = !allCnChecked && cn.quyens.some(q => ticked.has(q.id));
                      const tickCount = cn.quyens.filter(q => ticked.has(q.id)).length;

                      const isEven = idx % 2 === 0;

                      return (
                        <tr key={cn.id}
                          className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors"
                          style={{ background: isEven ? '#fafafa' : '#fff' }}>

                          {/* Module name + group checkbox */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <ICheck
                                checked={allCnChecked}
                                indeterminate={someCnChecked}
                                onChange={e => toggleChucNang(cn.quyens, e.target.checked)}
                              />
                              <span className="text-lg leading-none">{getIcon(cn.tenChucNang)}</span>
                              <div>
                                <p className="text-sm font-bold text-gray-800">
                                  {getModuleVI(cn.tenChucNang)}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {cn.tenChucNang} · {tickCount}/{cn.quyens.length} quyền
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Checkbox cho từng action */}
                          {allActions.map(action => {
                            const q = actionMap[action]; // undefined nếu ChucNang không có action này
                            return (
                              <td key={action} className="text-center px-3 py-4">
                                {q ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <input
                                      type="checkbox"
                                      checked={ticked.has(q.id)}
                                      onChange={() => toggle(q.id)}
                                      title={`${q.giaTriQuyen}\n(ID: ${q.id})`}
                                      className="w-5 h-5 cursor-pointer accent-blue-700"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-gray-200 text-lg leading-none select-none">·</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Footer tổng kết */}
                  <tfoot className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold text-gray-500">
                          Tổng: <span className="text-blue-600 font-bold">{totalTicked}</span> / {totalPerms} quyền đã chọn
                        </span>
                      </td>
                      {allActions.map(action => {
                        // Đếm số quyền action này đang được tick
                        const actionQuyens = tree.flatMap(cn => {
                          const q = cn.quyens.find(q => getAction(q.giaTriQuyen) === action);
                          return q ? [q] : [];
                        });
                        const tickedCount = actionQuyens.filter(q => ticked.has(q.id)).length;
                        return (
                          <td key={action} className="text-center px-3 py-3">
                            {actionQuyens.length > 0 ? (
                              <span className={`text-xs font-bold ${tickedCount === actionQuyens.length ? 'text-blue-600' : tickedCount > 0 ? 'text-amber-500' : 'text-gray-300'}`}>
                                {tickedCount}/{actionQuyens.length}
                              </span>
                            ) : (
                              <span className="text-gray-200 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* Banner lưu thay đổi */}
            {dirty && (
              <div className="px-6 py-3 border-t border-amber-200 bg-amber-50 flex items-center justify-between shrink-0">
                <div>
                  <p className="text-xs font-semibold text-amber-700">⚠️ Có thay đổi chưa được lưu</p>
                  <p className="text-[10px] text-amber-600 mt-0.5 font-mono">
                    vaiTroId: &quot;{selRole.id?.slice(-8)}&quot; · quyenIds: [{totalTicked} uuid]
                  </p>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2 text-sm font-bold rounded-lg text-white disabled:opacity-60 transition"
                  style={{ background: '#1e3a5f' }}>
                  {saving ? 'Đang lưu...' : 'Lưu ngay'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ══ Modal: Tạo vai trò mới ═══════════════════════════════════ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Tạo vai trò mới</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {createErr && (
                <div className="mb-4 px-4 py-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {createErr}
                </div>
              )}

              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tên vai trò <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateRole()}
                placeholder="VD: Manager, KeToan..."
                autoFocus
                className="w-full border border-gray-300 bg-gray-50 px-4 py-3 rounded-lg text-sm
                  focus:outline-none focus:border-blue-400 focus:bg-white transition"
              />
              <p className="text-[11px] text-gray-400 mt-2 font-mono">
                Payload: <code className="bg-gray-100 px-1 rounded">{`{ "tenVaiTro": "${newName || '...'}" }`}</code>
              </p>

              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  Hủy
                </button>
                <button onClick={handleCreateRole} disabled={creating}
                  className="flex-1 py-2.5 text-sm font-bold rounded-lg text-white disabled:opacity-60 transition"
                  style={{ background: '#1e3a5f' }}>
                  {creating ? 'Đang tạo...' : 'Tạo vai trò'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
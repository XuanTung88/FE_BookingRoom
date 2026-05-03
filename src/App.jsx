import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home                from './pages/Home';
import AuthPage            from './pages/AuthPage';
import BookingSearchPage   from './pages/BookingSearchPage';
import BookingConfirmPage  from './pages/BookingConfirmPage';
import BookingPaymentPage  from './pages/BookingPaymentPage';
import ProfileCompletePage from './pages/ProfileCompletePage';
import BookingHistoryPage  from './pages/BookingHistoryPage';

// Admin pages
import AdminDashboard        from './pages/AdminDashboard';
import RoomManagement        from './pages/RoomManagement';
import RoomTypeManagement    from './pages/RoomTypeManagement';
import ServiceManagement     from './pages/ServiceManagement';
import EquipmentManagement   from './pages/EquipmentManagement';
import PricePolicyManagement from './pages/PricePolicyManagement';
import AdminStaffPage     from './pages/AdminStaffPage';
import AdminRolesPage     from './pages/AdminRolesPage';
import AdminCustomersPage from './pages/AdminCustomersPage';


// Route guard – redirect nếu chưa đăng nhập
import { getStorageItem } from './utils/storage.util';
import AdminLayout from './components/Layout/AdminLayout';

function RequireAuth({ children, redirect = '/login' }) {
  const user = getStorageItem('user');
  const token = localStorage.getItem('token');
  if (!user || !token) return <Navigate to={redirect} replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" reverseOrder={false} />
      <Routes>
        {/* ── Public ──────────────────────────────────────────── */}
        <Route path="/"          element={<Home />} />
        <Route path="/login"     element={<AuthPage />} />
        <Route path="/register"  element={<AuthPage />} />

        {/* ── Booking flow ────────────────────────────────────── */}
        <Route path="/booking"          element={<BookingSearchPage />} />
        <Route path="/booking/confirm"  element={
          <RequireAuth redirect="/login?redirect=/booking">
            <BookingConfirmPage />
          </RequireAuth>
        } />
        <Route path="/booking/payment"  element={
          <RequireAuth redirect="/login?redirect=/booking">
            <BookingPaymentPage />
          </RequireAuth>
        } />
        <Route path="/booking/history"  element={
          <RequireAuth>
            <BookingHistoryPage />
          </RequireAuth>
        } />
        <Route path="/profile/complete" element={
          <RequireAuth>
            <ProfileCompletePage />
          </RequireAuth>
        } />

        {/* ── Admin ───────────────────────────────────────────── */}
        {/* ĐÃ FIX: Xóa bỏ thẻ <AdminLayout> lặp lại ở file App.jsx */}
        <Route path="/admin" element={
          <RequireAuth redirect="/login">
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path="/admin/rooms" element={
          <RequireAuth redirect="/login">
            <RoomManagement />
          </RequireAuth>
        } />
        <Route path="/admin/room-types" element={
          <RequireAuth redirect="/login">
            <RoomTypeManagement />
          </RequireAuth>
        } />
        <Route path="/admin/services" element={
          <RequireAuth redirect="/login">
            <ServiceManagement />
          </RequireAuth>
        } />
        <Route path="/admin/equipment" element={
          <RequireAuth redirect="/login">
            <EquipmentManagement />
          </RequireAuth>
        } />
        <Route path="/admin/pricing" element={
          <RequireAuth redirect="/login">
            <PricePolicyManagement />
          </RequireAuth>
        } />
        <Route path="/admin/staff" element={
          <RequireAuth redirect="/login">
            <AdminLayout>
              <AdminStaffPage />
            </AdminLayout>
          </RequireAuth>
        } />
        <Route path="/admin/roles" element={
          <RequireAuth redirect="/login">
            <AdminLayout>
              <AdminRolesPage />
            </AdminLayout>
          </RequireAuth>
        } />
       <Route path="/admin/customers" element={
          <RequireAuth redirect="/login">
            <AdminLayout>
              <AdminCustomersPage />
            </AdminLayout>
          </RequireAuth>
        } />


        {/* ── Fallback ────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
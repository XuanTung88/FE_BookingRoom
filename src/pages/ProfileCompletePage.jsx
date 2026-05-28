import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setStorageItem } from '../utils/storage.util';
import { getUserFromToken } from '../utils/jwt.util';
import apiClient from '../services/api.client';
import { getErrorMessage } from '../utils/error.util';

export default function ProfileCompletePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    soDienThoai: '', ngaySinh: '', gioiTinh: '', queQuan: '', cccd_Passport: '', quocTich: 'Việt Nam'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gửi POST lên ProfileController.cs
      const { data } = await apiClient.post('/api/profiles', form);
      
      // Backend trả về token mới chứa đầy đủ claims
      localStorage.setItem('token', data.token);
      const updatedUser = getUserFromToken(data.token);
      setStorageItem('user', updatedUser);
      
      alert('Cập nhật hồ sơ thành công!');
      navigate('/booking'); // Quay lại luồng đặt phòng
    } catch (err) {
      alert('Lỗi cập nhật: ' + getErrorMessage(err, 'Vui lòng thử lại'));
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6">
      <h1 className="text-2xl font-bold mb-6">Hoàn thiện thông tin cá nhân</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Số điện thoại" required className="w-full p-3 border rounded" 
               onChange={e => setForm({...form, soDienThoai: e.target.value})} />
        <input type="date" required className="w-full p-3 border rounded" 
               onChange={e => setForm({...form, ngaySinh: e.target.value})} />
        <select className="w-full p-3 border rounded" onChange={e => setForm({...form, gioiTinh: e.target.value})}>
          <option value="">Chọn giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
        <input type="text" placeholder="CCCD / Passport" className="w-full p-3 border rounded" 
               onChange={e => setForm({...form, cccd_Passport: e.target.value})} />
        <input type="text" placeholder="Quê quán" className="w-full p-3 border rounded" 
               onChange={e => setForm({...form, queQuan: e.target.value})} />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-bold">
          {loading ? 'ĐANG LƯU...' : 'HOÀN TẤT & TIẾP TỤC'}
        </button>
      </form>
    </div>
  );
}
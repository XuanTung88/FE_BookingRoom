import React from 'react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in-down">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center transform transition-all">
                {/* Icon Cảnh báo */}
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm mb-6">{message}</p>
                
                <div className="flex gap-3">
                    <button 
                        onClick={onCancel}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg transition">
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition shadow-md">
                        Đồng ý Xóa
                    </button>
                </div>
            </div>
        </div>
    );
}
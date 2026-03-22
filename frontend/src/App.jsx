import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import LeaveRequest from './pages/LeaveRequest';
import AdminLeaves from './pages/AdminLeaves';
import AdminDepartments from './pages/AdminDepartments';
import AdminAttendanceLog from './pages/AdminAttendanceLog'; 
import AdminQR from './pages/AdminQR';
import DirectScan from './pages/DirectScan';
import MyPerformance from './pages/MyPerformance';
import Profile from './pages/Profile';
import AdminManageDevices from './pages/AdminManageDevices';

import AdminAnnouncements from './pages/AdminAnnouncements';
import Announcements from './pages/Announcements';
import BottomNav from './components/BottomNav';
import AttendanceHub from './pages/AttendanceHub';
import LeaveHub from './pages/LeaveHub';
import TaskBoard from './pages/TaskBoard';
import FeedbackModal from './components/FeedbackModal';

// --- YARDIMCI: JWT token'dan payload'u decode et (kütüphane gerektirmez) ---
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

// --- YARDIMCI: Token'dan güvenli rol kontrolü ---
const getRoleFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  // Token süresi dolmuş mu?
  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  
  return decoded.role || null;
};

// --- ROTA KORUMA BİLEŞENLERİ ---
// Token yoksa veya süresi dolmuşsa login'e yönlendirir
const ProtectedRoute = ({ children }) => {
  const role = getRoleFromToken();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin/Superadmin rolü yoksa dashboard'a yönlendirir (JWT'den doğrulanır)
const AdminRoute = ({ children }) => {
  const role = getRoleFromToken();
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (!['admin', 'superadmin'].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const hideNavPages = ['/login', '/register', '/forgot-password', '/verify-email'];
  const isAuthPage = hideNavPages.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  return (
    <div className={!isAuthPage ? "pb-20 md:pb-0 font-sans min-h-screen bg-[#0f0f0f] text-white" : "font-sans min-h-screen bg-[#0f0f0f] text-white"}>
      <Routes>
        {/* --- HERKESE AÇIK (AUTH) SAYFALARI --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* --- GİRİŞ YAPMIŞ ÜYE ROTALARI (ProtectedRoute) --- */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leave-request" element={<ProtectedRoute><LeaveRequest /></ProtectedRoute>} />
        <Route path="/my-performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/attendance-hub" element={<ProtectedRoute><AttendanceHub /></ProtectedRoute>} />
        <Route path="/leave-hub" element={<ProtectedRoute><LeaveHub /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/direct-scan" element={<ProtectedRoute><DirectScan /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TaskBoard /></ProtectedRoute>} />

        {/* --- ADMİN ROTALARI (AdminRoute - JWT'den doğrulanır) --- */}
        <Route path="/admin/attendance-log" element={<AdminRoute><AdminAttendanceLog /></AdminRoute>} />
        <Route path="/admin/manage-devices" element={<AdminRoute><AdminManageDevices /></AdminRoute>} />
        <Route path="/admin/qr-generate" element={<AdminRoute><AdminQR /></AdminRoute>} />
        <Route path="/admin/leaves" element={<AdminRoute><AdminLeaves /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {!isAuthPage && <BottomNav />}
      {!isAuthPage && <FeedbackModal />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
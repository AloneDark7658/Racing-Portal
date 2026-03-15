import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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

// --- YENİ EKLENEN DUYURU SAYFALARI ---
import AdminAnnouncements from './pages/AdminAnnouncements';
import Announcements from './pages/Announcements';
import BottomNav from './components/BottomNav';
import AttendanceHub from './pages/AttendanceHub';
import LeaveHub from './pages/LeaveHub';

// --- ROTA KORUMA BİLEŞENLERİ (FAZ 1) ---
// Token yoksa kullanıcıyı login'e yönlendirir
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin/Superadmin rolü yoksa dashboard'a yönlendirir
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || (userData.role !== 'admin' && userData.role !== 'superadmin')) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const hideNavPages = ['/login', '/register', '/forgot-password'];
  const isAuthPage = hideNavPages.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  return (
    <div className={!isAuthPage ? "pb-20 md:pb-0 font-sans min-h-screen bg-[#0f0f0f] text-white" : "font-sans min-h-screen bg-[#0f0f0f] text-white"}>
      <Routes>
        {/* --- HERKESE AÇIK (AUTH) SAYFALARI --- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* --- GİRİŞ YAPMIŞ ÜYE ROTALARI (ProtectedRoute) --- */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/leave-request" element={<ProtectedRoute><LeaveRequest /></ProtectedRoute>} />
        <Route path="/my-performance" element={<ProtectedRoute><MyPerformance /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/attendance-hub" element={<ProtectedRoute><AttendanceHub /></ProtectedRoute>} />
        <Route path="/leave-hub" element={<ProtectedRoute><LeaveHub /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/direct-scan" element={<ProtectedRoute><DirectScan /></ProtectedRoute>} />

        {/* --- ADMİN ROTALARI (AdminRoute) --- */}
        <Route path="/admin/attendance-log" element={<AdminRoute><AdminAttendanceLog /></AdminRoute>} />
        <Route path="/admin/manage-devices" element={<AdminRoute><AdminManageDevices /></AdminRoute>} />
        <Route path="/admin/qr-generate" element={<AdminRoute><AdminQR /></AdminRoute>} />
        <Route path="/admin/leaves" element={<AdminRoute><AdminLeaves /></AdminRoute>} />
        <Route path="/admin/departments" element={<AdminRoute><AdminDepartments /></AdminRoute>} />
        <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {!isAuthPage && <BottomNav />}
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
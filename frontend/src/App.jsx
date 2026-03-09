import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import LeaveRequest from './pages/LeaveRequest';
import AdminLeaves from './pages/AdminLeaves';
import AdminAttendanceLog from './pages/AdminAttendanceLog'; // Yukarıya ekle
import AdminQR from './pages/AdminQR';
import DirectScan from './pages/DirectScan';
import MyPerformance from './pages/MyPerformance';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leave-request" element={<LeaveRequest />} />
        <Route path="/admin/attendance-log" element={<AdminAttendanceLog />} />
        <Route path="/my-performance" element={<MyPerformance />} />
        
        {/* BU İKİSİNİ KULLANDIN AMA YUKARIDA ÇAĞIRMAMIŞTIN */}
        <Route path="/admin/qr-generate" element={<AdminQR />} />
        <Route path="/direct-scan/:qrToken" element={<DirectScan />} />

        {/* ADMİN İZİN PANELİ ROTASI */}
        <Route path="/admin/leaves" element={<AdminLeaves />} />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
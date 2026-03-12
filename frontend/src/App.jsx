import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/manage-devices" element={<AdminManageDevices />} />
        <Route path="/admin/qr-generate" element={<AdminQR />} />

        <Route path="/admin/leaves" element={<AdminLeaves />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        
        {/* --- YENİ EKLENEN DUYURU ROTALARI --- */}
        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
        <Route path="/announcements" element={<Announcements />} />

        <Route path="/direct-scan" element={<DirectScan />} />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
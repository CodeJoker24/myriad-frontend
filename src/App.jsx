import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminSignIn from './pages/admin/SignIn';
import AdminSignUp from './pages/admin/SignUp';
import AdminDashboard from './pages/admin/AdminDashboard';
import { DashboardHome } from './pages/admin/dashboard/DashboardHome';
import { SchoolManagement } from './pages/admin/dashboard/SchoolManagement';
import { SiteManagement } from './pages/admin/dashboard/SiteManagement';
import { MyWards } from './pages/admin/dashboard/MyWards';
import { Profile } from './pages/admin/dashboard/Profile';
import { ClassroomManagement } from './pages/admin/dashboard/ClassroomManagement';
import { ResultManagement } from './pages/admin/dashboard/ResultManagement';
import { ChangePassword } from './pages/admin/dashboard/ChangePassword';
import { ResetPassword } from './pages/admin/dashboard/ResetPassword';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/signin" element={<AdminSignIn />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/dashboard/reset-password" element={<ResetPassword />} />
        
        {/* Protected Route - wraps all dashboard routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="school-management" element={<SchoolManagement />} />
          <Route path="site-management" element={<SiteManagement />} />
          <Route path="my-wards" element={<MyWards />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="classroom" element={<ClassroomManagement />} />
          <Route path="results" element={<ResultManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
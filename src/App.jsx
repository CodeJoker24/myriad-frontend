import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AdminSignIn from './pages/admin/SignIn';
import AdminSignUp from './pages/admin/SignUp';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherSignIn from './pages/teacher/TeacherSignIn';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import { TeacherHome } from './pages/teacher/dashboard/TeacherHome';
import { TeacherProfile } from './pages/teacher/dashboard/TeacherProfile';
import { TeacherChangePassword } from './pages/teacher/dashboard/TeacherChangePassword';
import { TeacherResetPassword } from './pages/teacher/dashboard/TeacherResetPassword';
import StudentSignIn from './pages/student/StudentSignIn';
import StudentDashboard from './pages/student/StudentDashboard';
import { StudentHome } from './pages/student/dashboard/StudentHome';
import { StudentProfile } from './pages/student/dashboard/StudentProfile';
import { StudentResults } from './pages/student/dashboard/StudentResults';
import { StudentAttendance } from './pages/student/dashboard/StudentAttendance';
import { StudentCourses } from './pages/student/dashboard/StudentCourses';
import { StudentChangePassword } from './pages/student/dashboard/StudentChangePassword';
import { DashboardHome } from './pages/admin/dashboard/DashboardHome';
import { SchoolManagementLayout } from './pages/admin/dashboard/school-management/SchoolManagementLayout';
import { Students } from './pages/admin/dashboard/school-management/students/Students';
import { Teachers } from './pages/admin/dashboard/school-management/teachers/Teachers';
import { Attendance } from './pages/admin/dashboard/school-management/attendance/Attendance';
import { SiteManagement } from './pages/admin/dashboard/SiteManagement';
import { MyWards } from './pages/admin/dashboard/MyWards';
import { Profile } from './pages/admin/dashboard/Profile';
import { ClassroomManagement } from './pages/admin/dashboard/ClassroomManagement';
import { ResultManagement } from './pages/admin/dashboard/ResultManagement';
import { ChangePassword } from './pages/admin/dashboard/ChangePassword';
import { ResetPassword } from './pages/admin/dashboard/ResetPassword';
import { ProtectedRoute } from './components/ProtectedRoute';
import TeacherProtectedRoute from './components/TeacherProtectedRoute';
import StudentProtectedRoute from './components/StudentProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Admin Routes */}
        <Route path="/admin/signin" element={<AdminSignIn />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/dashboard/reset-password" element={<ResetPassword />} />
        
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="school-management" element={<SchoolManagementLayout />}>
            <Route index element={<Students />} />
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>
          <Route path="site-management" element={<SiteManagement />} />
          <Route path="my-wards" element={<MyWards />} />
          <Route path="profile" element={<Profile />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="classroom" element={<ClassroomManagement />} />
          <Route path="results" element={<ResultManagement />} />
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher/signin" element={<TeacherSignIn />} />
        <Route path="/teacher/setup-password" element={<TeacherResetPassword />} />
        
        <Route path="/teacher/dashboard" element={
          <TeacherProtectedRoute>
            <TeacherDashboard />
          </TeacherProtectedRoute>
        }>
          <Route index element={<TeacherHome />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="change-password" element={<TeacherChangePassword />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student/signin" element={<StudentSignIn />} />
        
        <Route path="/student/dashboard" element={
          <StudentProtectedRoute>
            <StudentDashboard />
          </StudentProtectedRoute>
        }>
          <Route index element={<StudentHome />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="courses" element={<StudentCourses />} />
          <Route path="change-password" element={<StudentChangePassword />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AdminSignIn from './pages/admin/SignIn';
import AdminSignUp from './pages/admin/SignUp';
import  AdminDashboard  from './pages/admin/AdminDashboard';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import AdminDashboard from './pages/dashboard/AdminDashboard';
// import TeacherDashboard from './pages/dashboard/TeacherDashboard';
// import StudentDashboard from './pages/dashboard/StudentDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
         <Route path="/admin/signin" element={<AdminSignIn />} />
        <Route path="/admin/signup" element={<AdminSignUp />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
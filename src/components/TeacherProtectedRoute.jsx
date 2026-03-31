import { Navigate } from 'react-router-dom';

const TeacherProtectedRoute = ({ children }) => {
 
  const teacher = localStorage.getItem('teacher');
  const token = localStorage.getItem('teacherToken');
  const userType = localStorage.getItem('userType');

 
  if (!teacher || !token || userType !== 'teacher') {
  
    localStorage.removeItem('teacher');
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('userType');
    
    
    return <Navigate to="/teacher/signin" replace />;
  }

  return children;
};

export default TeacherProtectedRoute;
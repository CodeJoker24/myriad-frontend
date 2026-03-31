import { Navigate } from 'react-router-dom';

const TeacherProtectedRoute = ({ children }) => {
  const teacher = JSON.parse(localStorage.getItem('teacher'));
  const token = localStorage.getItem('teacherToken');

  if (!teacher || !token) {
    return <Navigate to="/teacher/signin" replace />;
  }

  return children;
};

export default TeacherProtectedRoute;
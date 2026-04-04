import { Navigate } from 'react-router-dom';

const StudentProtectedRoute = ({ children }) => {
  const student = localStorage.getItem('student');
  const token = localStorage.getItem('studentToken');
  const userType = localStorage.getItem('userType');

  if (!student || !token || userType !== 'student') {
    localStorage.removeItem('student');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('userType');
    return <Navigate to="/student/signin" replace />;
  }

  return children;
};

export default StudentProtectedRoute;
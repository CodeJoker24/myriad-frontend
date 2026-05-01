import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const TeacherProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const teacher = localStorage.getItem('teacher');
        const token = localStorage.getItem('teacherToken');
        const userType = localStorage.getItem('userType');

        if (teacher && token && userType === 'teacher') {
          setIsAuthenticated(true);
        } else {
        
          localStorage.removeItem('teacher');
          localStorage.removeItem('teacherToken');
          localStorage.removeItem('userType');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/teacher/signin" replace />;
  }

  return children;
};

export default TeacherProtectedRoute;
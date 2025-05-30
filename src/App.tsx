import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailsPage from './pages/courses/CourseDetailsPage';
import CreateCoursePage from './pages/courses/CreateCoursePage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import QuizManagementPage from './pages/quizzes/QuizManagementPage';
import QuizTakingPage from './pages/quizzes/QuizTakingPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected route wrapper
const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['student', 'faculty', 'admin'],
}: { 
  children: React.ReactNode, 
  allowedRoles?: string[]
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth routes */}
        <Route path="/" element={<AuthLayout />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Dashboard routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:courseId" element={<CourseDetailsPage />} />
          
          {/* Quiz Management Routes */}
          <Route path="courses/:courseId/quizzes" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <QuizManagementPage />
            </ProtectedRoute>
          } />
          
          {/* Quiz Taking Routes */}
          <Route path="courses/:courseId/quiz/:quizId" element={<QuizTakingPage />} />
          
          <Route path="courses/create" element={
            <ProtectedRoute allowedRoles={['faculty', 'admin']}>
              <CreateCoursePage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={<ProfilePage />} />
          
          {/* Admin routes */}
          <Route path="admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsersPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  BookOpen, Home, BookText, User, LogOut, Menu, X,
  PlusCircle, Settings, Users, Shield, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../lib/utils';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Navigation items based on user role
  const navigationItems = [
    { name: 'Dashboard', to: '/dashboard', icon: Home },
    { name: 'Courses', to: '/courses', icon: BookText },
    ...(user?.role === 'faculty' || user?.role === 'admin' ? [
      { name: 'Create Course', to: '/courses/create', icon: PlusCircle },
    ] : []),
    { name: 'Profile', to: '/profile', icon: User },
  ];

  // Admin navigation items
  const adminItems = user?.role === 'admin' ? [
    { name: 'Manage Users', to: '/admin/users', icon: Users },
    { name: 'System Settings', to: '/admin/settings', icon: Settings },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow bg-primary-800 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <BookOpen className="h-8 w-8 text-white" />
            <span className="ml-2 text-white font-medium text-xl">Course Portal</span>
          </div>
          
          <div className="mt-8 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {/* Main Navigation */}
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                          isActive
                            ? 'bg-primary-900 text-white'
                            : 'text-white hover:bg-primary-700'
                        )
                      }
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </div>

              {/* Admin Section */}
              {adminItems.length > 0 && (
                <div className="pt-6">
                  <div className="px-2 pb-2">
                    <div className="flex items-center text-xs font-semibold text-primary-200 uppercase tracking-wider">
                      <Shield className="mr-2 h-4 w-4" />
                      Administration
                    </div>
                  </div>
                  <div className="space-y-1">
                    {adminItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.name}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                              isActive
                                ? 'bg-primary-900 text-white'
                                : 'text-white hover:bg-primary-700'
                            )
                          }
                        >
                          <Icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* User Info Section */}
              <div className="pt-6 mt-auto">
                <div className="px-2 pb-2">
                  <div className="flex items-center p-2 rounded-md bg-primary-700">
                    <div className="flex-shrink-0">
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-800" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.name}
                      </p>
                      <p className="text-xs text-primary-200 capitalize">
                        {user?.role}
                      </p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left group flex items-center px-2 py-2 text-sm font-medium rounded-md text-white hover:bg-primary-700"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-primary-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8" />
            <span className="ml-2 font-medium text-xl">Course Portal</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-primary-700 animate-slide-in">
            {/* Main Navigation */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block px-3 py-2 rounded-md text-base font-medium',
                      isActive
                        ? 'bg-primary-900 text-white'
                        : 'text-white hover:bg-primary-800'
                    )
                  }
                  onClick={closeMobileMenu}
                >
                  <div className="flex items-center">
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                </NavLink>
              );
            })}
            
            {/* Admin Section */}
            {adminItems.length > 0 && (
              <>
                <div className="px-3 py-2">
                  <div className="flex items-center text-xs font-semibold text-primary-200 uppercase tracking-wider">
                    <Shield className="mr-2 h-4 w-4" />
                    Administration
                  </div>
                </div>
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'block px-3 py-2 rounded-md text-base font-medium',
                          isActive
                            ? 'bg-primary-900 text-white'
                            : 'text-white hover:bg-primary-800'
                        )
                      }
                      onClick={closeMobileMenu}
                    >
                      <div className="flex items-center">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </div>
                    </NavLink>
                  );
                })}
              </>
            )}
            
            {/* User Info */}
            <div className="px-3 py-2 border-t border-primary-600 mt-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-primary-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-800" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-primary-200 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-primary-800"
            >
              <div className="flex items-center">
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="md:pl-64 flex flex-col">
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
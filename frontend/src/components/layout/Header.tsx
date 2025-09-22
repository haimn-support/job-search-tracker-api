import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ThemeToggle } from '../ui/ThemeToggle';
import { SkipLink } from '../ui/SkipLink';

export interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <header 
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
        role="banner"
        aria-label="Site header"
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 lg:px-8">
        {/* Left side - Logo and mobile menu button */}
        <div className="flex items-center">
          {/* Mobile menu button - larger touch target */}
          <button
            type="button"
            className="inline-flex items-center justify-center p-3 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden touch-manipulation"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar-navigation"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center ml-2 sm:ml-4 lg:ml-0"
            aria-label="Interview Position Tracker - Go to Dashboard"
          >
            <div className="flex-shrink-0 flex items-center">
              <svg
                className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
                <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
              </svg>
              <span className="ml-2 text-lg sm:text-xl font-semibold text-gray-900 hidden sm:block">
                Interview Tracker
              </span>
            </div>
          </Link>
        </div>

        {/* Right side - Navigation, theme toggle, and user menu */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Desktop navigation */}
          <nav 
            className="hidden md:flex space-x-6 lg:space-x-8"
            role="navigation"
            aria-label="Main navigation"
          >
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-current={location.pathname === '/dashboard' ? 'page' : undefined}
            >
              Dashboard
            </Link>
            <Link
              to="/positions"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-current={location.pathname.startsWith('/positions') ? 'page' : undefined}
            >
              Positions
            </Link>
            <Link
              to="/statistics"
              className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-current={location.pathname === '/statistics' ? 'page' : undefined}
            >
              Statistics
            </Link>
          </nav>

          {/* User menu - larger touch target on mobile */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 sm:p-0 touch-manipulation"
              onClick={toggleUserMenu}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              aria-label={`User menu for ${user?.first_name} ${user?.last_name}`}
              id="user-menu-button"
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 sm:h-8 sm:w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white" aria-hidden="true">
                  {user?.first_name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                {user?.first_name} {user?.last_name}
              </span>
              <svg
                className="ml-1 h-4 w-4 text-gray-400 hidden sm:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div 
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
              >
                <div className="py-1">
                  <div className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100">
                    <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-gray-500 text-xs">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors touch-manipulation focus:outline-none focus:bg-gray-100"
                    role="menuitem"
                    tabIndex={0}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Mobile navigation overlay */}
        {userMenuOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setUserMenuOpen(false)}
          />
        )}
      </header>
    </>
  );
};

export default Header;
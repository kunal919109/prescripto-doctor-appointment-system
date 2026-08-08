import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { useDoctorContext } from '../context/DoctorContext.jsx';

/**
 * Decode the email from a JWT payload without verifying the signature.
 * Safe for display-only purposes in the browser.
 */
const getEmailFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.email || payload.id || '';
  } catch {
    return '';
  }
};

const Navbar = ({ onMenuToggle, sidebarOpen }) => {
  const navigate = useNavigate();
  const { adminToken, setAdminToken } = useAppContext();
  const { dToken, setDToken } = useDoctorContext();

  const handleLogout = () => {
    if (adminToken) setAdminToken('');
    if (dToken) setDToken('');
    navigate('/login');
  };

  const portalLabel = adminToken ? 'Admin Panel' : dToken ? 'Doctor Dashboard' : 'Prescripto';
  const activeToken = adminToken || dToken;
  const userEmail = activeToken ? getEmailFromToken(activeToken) : '';
  const isAuthenticated = adminToken || dToken;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Mobile hamburger + Brand */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm" aria-hidden="true">Rx</span>
            </div>
            <div className="min-w-0">
              <span className="text-base font-bold text-text-primary">Prescripto</span>
              <span className="ml-2 text-xs font-medium text-text-secondary bg-secondary px-2 py-0.5 rounded-full hidden sm:inline">
                {portalLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Active user + Logout */}
        {isAuthenticated && (
          <div className="flex items-center gap-3 sm:gap-4">
            {userEmail && (
              <span className="hidden sm:block text-sm text-text-secondary truncate max-w-[180px]">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="border border-error text-error hover:bg-red-50 text-sm font-medium rounded-lg px-3 sm:px-4 py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

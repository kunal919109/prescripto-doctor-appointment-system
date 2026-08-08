import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import { useDoctorContext } from '../context/DoctorContext.jsx';

const adminLinks = [
  { to: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/all-appointments', label: 'Appointments', icon: '📅' },
  { to: '/add-doctor', label: 'Add Doctor', icon: '➕' },
  { to: '/doctor-list', label: 'Doctors List', icon: '👨‍⚕️' },
];

const doctorLinks = [
  { to: '/doctor-dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/doctor-appointments', label: 'Appointments', icon: '📅' },
  { to: '/doctor-profile', label: 'My Profile', icon: '👤' },
];

const Sidebar = ({ onLinkClick }) => {
  const { adminToken } = useAppContext();
  const { dToken } = useDoctorContext();

  const links = adminToken ? adminLinks : dToken ? doctorLinks : [];

  if (!adminToken && !dToken) return null;

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-border min-h-screen pt-4">
      <nav className="px-3 space-y-1" aria-label="Main navigation">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-secondary hover:text-primary'
              }`
            }
          >
            <span aria-hidden="true">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

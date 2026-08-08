import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AllAppointments from './pages/admin/AllAppointments.jsx';
import AddDoctor from './pages/admin/AddDoctor.jsx';
import DoctorsList from './pages/admin/DoctorsList.jsx';
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx';
import DoctorAppointments from './pages/doctor/DoctorAppointments.jsx';
import DoctorProfile from './pages/doctor/DoctorProfile.jsx';
import { useAppContext } from './context/AppContext.jsx';
import { useDoctorContext } from './context/DoctorContext.jsx';

const App = () => {
  const { adminToken } = useAppContext();
  const { dToken } = useDoctorContext();
  const isAuthenticated = adminToken || dToken;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} />
      <div className="flex">
        {isAuthenticated && (
          <>
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/40 md:hidden"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
            )}
            {/* Sidebar: off-canvas on mobile, always visible on md+ */}
            <div
              className={`fixed top-16 inset-x-0 bottom-0 left-0 right-auto w-56 z-40 transform transition-transform duration-300 md:static md:top-auto md:translate-x-0 md:z-auto md:w-auto md:inset-auto ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <Sidebar onLinkClick={() => setSidebarOpen(false)} />
            </div>
          </>
        )}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Admin-only routes:
                - adminToken present  → render page
                - dToken present      → cross-role: redirect to /doctor-dashboard
                - neither token       → redirect to /login
            */}
            <Route
              path="/admin-dashboard"
              element={
                adminToken ? <Dashboard />
                : dToken ? <Navigate to="/doctor-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/all-appointments"
              element={
                adminToken ? <AllAppointments />
                : dToken ? <Navigate to="/doctor-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/add-doctor"
              element={
                adminToken ? <AddDoctor />
                : dToken ? <Navigate to="/doctor-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/doctor-list"
              element={
                adminToken ? <DoctorsList />
                : dToken ? <Navigate to="/doctor-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />

            {/* Doctor-only routes:
                - dToken present      → render page
                - adminToken present  → cross-role: redirect to /admin-dashboard
                - neither token       → redirect to /login
            */}
            <Route
              path="/doctor-dashboard"
              element={
                dToken ? <DoctorDashboard />
                : adminToken ? <Navigate to="/admin-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/doctor-appointments"
              element={
                dToken ? <DoctorAppointments />
                : adminToken ? <Navigate to="/admin-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/doctor-profile"
              element={
                dToken ? <DoctorProfile />
                : adminToken ? <Navigate to="/admin-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />

            {/* Default redirect */}
            <Route
              path="*"
              element={
                adminToken ? <Navigate to="/admin-dashboard" replace />
                : dToken ? <Navigate to="/doctor-dashboard" replace />
                : <Navigate to="/login" replace />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

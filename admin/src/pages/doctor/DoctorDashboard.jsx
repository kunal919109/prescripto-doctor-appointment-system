import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDoctorContext } from '../../context/DoctorContext.jsx';
import SkeletonRow from '../../components/SkeletonRow.jsx';

/**
 * Converts slotDate "DD_MM_YYYY" to a human-readable "DD Mon YYYY" string.
 */
const formatDate = (slotDate) => {
  if (!slotDate) return '—';
  const [dd, mm, yyyy] = slotDate.split('_');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(dd, 10)} ${months[parseInt(mm, 10) - 1]} ${yyyy}`;
};

/**
 * Returns Tailwind badge classes based on appointment status flags.
 */
const getStatusBadge = (appt) => {
  if (appt.cancelled)   return { label: 'Cancelled', cls: 'bg-red-100 text-red-700' };
  if (appt.isCompleted) return { label: 'Completed', cls: 'bg-green-100 text-green-700' };
  if (appt.payment)     return { label: 'Paid',      cls: 'bg-blue-100 text-blue-700' };
  return                       { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' };
};

// ----- Stat Card -----

const StatCard = ({ icon, label, value, loading }) => (
  <div className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary text-xl flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-text-secondary text-xs font-medium uppercase tracking-wide">{label}</p>
      {loading ? (
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-text-primary text-2xl font-bold leading-tight">{value}</p>
      )}
    </div>
  </div>
);

// ----- Earnings Card -----

const EarningsCard = ({ earnings, loading }) => (
  <div className="bg-primary rounded-2xl p-6 flex items-center gap-5 shadow-md">
    <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl flex-shrink-0">
      💰
    </div>
    <div>
      <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Total Earnings</p>
      {loading ? (
        <div className="h-8 w-28 bg-white/30 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-white text-3xl font-bold leading-tight">
          ${Number(earnings ?? 0).toFixed(2)}
        </p>
      )}
    </div>
  </div>
);

// ----- DoctorDashboard -----

const DoctorDashboard = () => {
  const { dToken, backendUrl } = useDoctorContext();

  const [dashData, setDashData] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/dashboard`, {
        headers: { dtoken: dToken },
      });
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message || 'Failed to load dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dToken) fetchDashboard();
  }, [dToken]);

  const latestAppointments = dashData?.latestAppointments ?? [];

  const totalAppointments = dashData?.appointments ?? 0;
  const completedCount    = dashData?.completed ?? 0;
  const pendingCount      = dashData?.pending ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Doctor Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Your practice overview at a glance</p>
      </div>

      {/* Earnings Card */}
      <EarningsCard earnings={dashData?.earnings} loading={loading} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          icon="📅"
          label="Total Appointments"
          value={totalAppointments}
          loading={loading}
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={completedCount}
          loading={loading}
        />
        <StatCard
          icon="⏳"
          label="Pending"
          value={pendingCount}
          loading={loading}
        />
        <StatCard
          icon="🧑‍🤝‍🧑"
          label="Patients"
          value={dashData?.patients ?? 0}
          loading={loading}
        />
      </div>

      {/* Latest Appointments Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Latest Appointments</h2>
          <span className="text-xs text-text-secondary">Most recent 5</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Patient</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Fee</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : latestAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📋</span>
                      <span>No appointments yet</span>
                    </div>
                  </td>
                </tr>
              ) : (
                latestAppointments.map((appt) => {
                  const { label, cls } = getStatusBadge(appt);
                  return (
                    <tr key={appt._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {appt.userData?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(appt.slotDate)}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {appt.slotTime ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        ${Number(appt.amount ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                          {label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;

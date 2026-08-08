import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext.jsx';
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
  if (appt.cancelled)    return { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' };
  if (appt.isCompleted)  return { label: 'Completed',  cls: 'bg-green-100 text-green-700' };
  if (appt.payment)      return { label: 'Paid',        cls: 'bg-blue-100 text-blue-700' };
  return                        { label: 'Pending',     cls: 'bg-yellow-100 text-yellow-700' };
};

// ----- Inline ConfirmDialog (self-contained, no external import needed) -----

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, loading }) => {
  const cancelBtnRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const triggerRef = useRef(null);

  // Capture trigger element on open; restore focus on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      const id = requestAnimationFrame(() => cancelBtnRef.current?.focus());
      return () => cancelAnimationFrame(id);
    } else {
      document.body.style.overflow = '';
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
        triggerRef.current = null;
      }
    }
  }, [open]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { if (!loading) onCancel(); return; }
    if (e.key !== 'Tab') return;
    const focusable = [cancelBtnRef.current, confirmBtnRef.current].filter(Boolean);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-secondary transition-colors duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Keep Appointment
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-lg border border-error text-sm font-medium text-error hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-error border-t-transparent rounded-full animate-spin" />
            )}
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

// ----- AllAppointments -----

const AllAppointments = () => {
  const { adminToken, backendUrl } = useAppContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen]         = useState(false);
  const [confirmTarget, setConfirmTarget]     = useState(null); // appointment _id
  const [cancelLoading, setCancelLoading]     = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/appointments`, {
        headers: { atoken: adminToken },
      });
      if (data.success) {
        setAppointments(data.appointments ?? []);
      } else {
        toast.error(data.message || 'Failed to load appointments');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [adminToken, backendUrl]);

  useEffect(() => {
    if (adminToken) fetchAppointments();
  }, [adminToken, fetchAppointments]);

  const openCancelConfirm = (appointmentId) => {
    setConfirmTarget(appointmentId);
    setConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!confirmTarget) return;
    setCancelLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/cancel-appointment`,
        { appointmentId: confirmTarget },
        { headers: { atoken: adminToken } }
      );
      if (data.success) {
        toast.success(data.message || 'Appointment cancelled');
        setConfirmOpen(false);
        setConfirmTarget(null);
        // Refresh the list to reflect the updated status
        await fetchAppointments();
      } else {
        toast.error(data.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelDismiss = () => {
    if (cancelLoading) return;
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">All Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">
          Manage every appointment across the platform
        </p>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Patient</th>
                <th className="px-4 py-3 text-left font-medium">Doctor</th>
                <th className="px-4 py-3 text-left font-medium">Specialty</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Fee</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // 7 columns + 2 extra for specialty and action = 9 cols
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📋</span>
                      <span className="font-medium">No appointments found</span>
                      <span className="text-xs">Appointments will appear here once patients book.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appt, index) => {
                  const { label, cls } = getStatusBadge(appt);
                  const isPending = !appt.cancelled && !appt.isCompleted;

                  return (
                    <tr key={appt._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-4 py-3 text-text-secondary">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        {appt.userData?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {appt.docData?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {appt.docData?.speciality ?? '—'}
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
                      <td className="px-4 py-3">
                        {isPending ? (
                          <button
                            onClick={() => openCancelConfirm(appt._id)}
                            className="px-3 py-1.5 rounded-lg border border-error text-error text-xs font-medium hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-1"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone and the time slot will be released."
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelDismiss}
        loading={cancelLoading}
      />
    </div>
  );
};

export default AllAppointments;

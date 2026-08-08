import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDoctorContext } from '../../context/DoctorContext.jsx';
import SkeletonRow from '../../components/SkeletonRow.jsx';

// Placeholder avatar for patients without a photo
const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/demo/image/upload/v1/placeholder_avatar.png';

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
 * Returns status label + Tailwind badge classes based on appointment flags.
 */
const getStatusBadge = (appt) => {
  if (appt.cancelled)   return { label: 'Cancelled', cls: 'bg-red-100 text-red-700' };
  if (appt.isCompleted) return { label: 'Completed', cls: 'bg-green-100 text-green-700' };
  if (appt.payment)     return { label: 'Paid',      cls: 'bg-blue-100 text-blue-700' };
  return                       { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' };
};

// ----- Inline ConfirmDialog (with focus trap) -----

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
        aria-labelledby="doctor-confirm-dialog-title"
        aria-describedby="doctor-confirm-dialog-message"
        className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full z-10"
      >
        <h3 id="doctor-confirm-dialog-title" className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p id="doctor-confirm-dialog-message" className="text-sm text-text-secondary mb-6">{message}</p>
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

// ----- DoctorAppointments -----

const DoctorAppointments = () => {
  const { dToken, backendUrl } = useDoctorContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  // Complete action state
  const [completeLoading, setCompleteLoading] = useState(null); // appointmentId being completed

  // Cancel / confirm dialog state
  const [confirmOpen, setConfirmOpen]     = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);   // appointmentId to cancel
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: { dtoken: dToken },
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
  }, [dToken, backendUrl]);

  useEffect(() => {
    if (dToken) fetchAppointments();
  }, [dToken, fetchAppointments]);

  // ---- Complete appointment ----
  const handleComplete = async (appointmentId) => {
    setCompleteLoading(appointmentId);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/complete-appointment`,
        { appointmentId },
        { headers: { dtoken: dToken } }
      );
      if (data.success) {
        toast.success(data.message || 'Appointment marked as complete');
        await fetchAppointments();
      } else {
        toast.error(data.message || 'Failed to complete appointment');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setCompleteLoading(null);
    }
  };

  // ---- Cancel appointment (via confirm dialog) ----
  const openCancelConfirm = (appointmentId) => {
    setConfirmTarget(appointmentId);
    setConfirmOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!confirmTarget) return;
    setCancelLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/cancel-appointment`,
        { appointmentId: confirmTarget },
        { headers: { dtoken: dToken } }
      );
      if (data.success) {
        toast.success(data.message || 'Appointment cancelled');
        setConfirmOpen(false);
        setConfirmTarget(null);
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
        <h1 className="text-2xl font-bold text-text-primary">My Appointments</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your patient appointments</p>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium">#</th>
                <th className="px-4 py-3 text-left font-medium">Patient</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">Fee</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">📋</span>
                      <span className="font-medium">No appointments found</span>
                      <span className="text-xs">Your scheduled appointments will appear here.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((appt, index) => {
                  const { label, cls } = getStatusBadge(appt);
                  const isPending = !appt.cancelled && !appt.isCompleted;
                  const isCompletingThis = completeLoading === appt._id;

                  return (
                    <tr key={appt._id} className="hover:bg-gray-50 transition-colors duration-150">
                      {/* Row number */}
                      <td className="px-4 py-3 text-text-secondary">{index + 1}</td>

                      {/* Patient name + avatar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={appt.userData?.image || PLACEHOLDER_IMAGE}
                            alt={appt.userData?.name ?? 'Patient'}
                            onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-border"
                          />
                          <span className="font-medium text-text-primary">
                            {appt.userData?.name ?? '—'}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-text-secondary">
                        {formatDate(appt.slotDate)}
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 text-text-secondary">
                        {appt.slotTime ?? '—'}
                      </td>

                      {/* Fee */}
                      <td className="px-4 py-3 text-text-secondary">
                        ${Number(appt.amount ?? 0).toFixed(2)}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
                          {label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            {/* Complete button */}
                            <button
                              onClick={() => handleComplete(appt._id)}
                              disabled={isCompletingThis}
                              className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                            >
                              {isCompletingThis && (
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              )}
                              Complete
                            </button>

                            {/* Cancel button */}
                            <button
                              onClick={() => openCancelConfirm(appt._id)}
                              disabled={isCompletingThis}
                              className="px-3 py-1.5 rounded-lg border border-error text-error text-xs font-medium hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-1"
                            >
                              Cancel
                            </button>
                          </div>
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

export default DoctorAppointments;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const StatusBadge = ({ appointment }) => {
  if (appointment.isCompleted) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
        Completed
      </span>
    );
  }
  if (appointment.cancelled) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
        Cancelled
      </span>
    );
  }
  if (appointment.payment) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
      Pending
    </span>
  );
};

// Format slotDate "DD_MM_YYYY" → "12 Jul 2025"
const formatDate = (slotDate) => {
  const [dd, mm, yyyy] = slotDate.split('_');
  return new Date(`${yyyy}-${mm}-${dd}`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const MyAppointments = () => {
  const { token, backendUrl, currencySymbol } = useAppContext();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState({ open: false, appointmentId: null });
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/appointments`, {
        headers: { token },
      });
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ─── Cancel ───
  const openCancelDialog = (appointmentId) => {
    setCancelDialog({ open: true, appointmentId });
  };

  const handleConfirmCancel = async () => {
    const { appointmentId } = cancelDialog;
    setCancelDialog({ open: false, appointmentId: null });
    setCancellingId(appointmentId);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/cancel-appointment`,
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success('Appointment cancelled');
        fetchAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  // ─── Razorpay Payment ───
  const handlePay = async (appointmentId) => {
    setPayingId(appointmentId);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/payment-razorpay`,
        { appointmentId },
        { headers: { token } }
      );

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const order = data.order;

      // Check Razorpay script is loaded
      if (!window.Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh the page.');
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Prescripto',
        description: 'Appointment Consultation Fee',
        order_id: order.id,
        handler: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          try {
            const { data: verifyData } = await axios.post(
              `${backendUrl}/api/user/verifyRazorpay`,
              { razorpay_payment_id, razorpay_order_id, razorpay_signature },
              { headers: { token } }
            );
            if (verifyData.success) {
              toast.success('Payment successful!');
              fetchAppointments();
            } else {
              toast.error('Payment verification failed.');
            }
          } catch {
            toast.error('Payment verification error.');
          }
        },
        theme: { color: '#5F6FFF' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment initiation failed.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-text-primary mb-8">My Appointments</h1>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="bg-gray-200 rounded-xl w-20 h-20 flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && appointments.length === 0 && (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg font-semibold text-text-primary mb-2">No appointments yet</p>
          <p className="text-text-secondary">Book your first appointment to get started.</p>
        </div>
      )}

      {/* Appointments list */}
      {!loading && appointments.length > 0 && (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-white rounded-2xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-4"
            >
              {/* Doctor photo */}
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                <img
                  src={
                    appt.docData?.image ||
                    'https://ui-avatars.com/api/?name=Doctor&background=5F6FFF&color=fff'
                  }
                  alt={appt.docData?.name || 'Doctor'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-text-primary truncate">Dr. {appt.docData?.name}</h3>
                    <p className="text-sm text-text-secondary truncate">{appt.docData?.speciality}</p>
                  </div>
                  <StatusBadge appointment={appt} />
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <span>📅 {formatDate(appt.slotDate)}</span>
                  <span>🕐 {appt.slotTime}</span>
                  <span className="font-medium text-text-primary">
                    {currencySymbol}
                    {Number(appt.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!appt.cancelled && !appt.isCompleted && (
                <div className="flex flex-row sm:flex-col gap-2 items-start sm:items-end justify-end flex-shrink-0">
                  {!appt.payment && (
                    <button
                      onClick={() => handlePay(appt._id)}
                      disabled={payingId === appt._id}
                      className="bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-full px-5 py-2 transition-colors duration-200 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {payingId === appt._id ? 'Processing...' : 'Pay Now'}
                    </button>
                  )}
                  <button
                    onClick={() => openCancelDialog(appt._id)}
                    disabled={cancellingId === appt._id}
                    className="border border-error text-error hover:bg-red-50 text-sm font-medium rounded-full px-5 py-2 transition-colors duration-200 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2"
                  >
                    {cancellingId === appt._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm cancel dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialog({ open: false, appointmentId: null })}
      />
    </div>
  );
};

export default MyAppointments;

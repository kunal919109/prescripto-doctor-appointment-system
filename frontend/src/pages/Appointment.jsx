import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext.jsx';
import RelatedDoctors from '../components/RelatedDoctors.jsx';

// Generate available slot times (09:00–20:30, 30-min) for a single date
function generateDaySlots(date, bookedSlots, isToday) {
  const slots = [];
  const now = new Date();

  const start = new Date(date);
  start.setHours(9, 0, 0, 0);
  const end = new Date(date);
  end.setHours(21, 0, 0, 0);

  while (start < end) {
    const h = start.getHours();
    const m = start.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const label = `${displayH}:${String(m).padStart(2, '0')} ${period}`;

    const isPast = isToday && start <= now;
    const isBooked = (bookedSlots || []).includes(label);

    if (!isPast && !isBooked) {
      slots.push(label);
    }

    start.setMinutes(start.getMinutes() + 30);
  }

  return slots;
}

// Format date as "DD_MM_YYYY"
function toDateKey(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}_${mm}_${date.getFullYear()}`;
}

// Display label: "Mon, Jul 12"
function formatDateLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const Appointment = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { doctors, token, backendUrl, getDoctors } = useAppContext();

  const [doctor, setDoctor] = useState(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);

  // Build 7-day slot structure
  const [weekSlots, setWeekSlots] = useState([]); // [{ date, dateKey, label, slots[] }]

  // Find doctor from context
  useEffect(() => {
    const found = doctors.find(d => d._id === docId);
    setDoctor(found || null);
  }, [docId, doctors]);

  // Regenerate slots whenever doctor changes
  useEffect(() => {
    if (!doctor) return;
    const today = new Date();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const key = toDateKey(d);
      const booked = doctor.slots_booked?.[key] || [];
      const slots = generateDaySlots(d, booked, i === 0);
      days.push({ date: d, dateKey: key, label: formatDateLabel(d), slots });
    }
    setWeekSlots(days);
    setSelectedDateIdx(0);
    setSelectedSlot('');
  }, [doctor]);

  const currentDay = weekSlots[selectedDateIdx];
  const hasAnySlots = weekSlots.some(d => d.slots.length > 0);

  const handleBook = async () => {
    if (!token) {
      toast.info('Please log in to book an appointment');
      navigate('/login');
      return;
    }
    if (!selectedSlot || !currentDay) return;

    setBooking(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/user/book-appointment`,
        { docId, slotDate: currentDay.dateKey, slotTime: selectedSlot },
        { headers: { token } }
      );
      if (data.success) {
        toast.success('Appointment booked!');
        getDoctors(); // refresh slots
        navigate('/my-appointments');
        window.scrollTo(0, 0);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (!doctor) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="bg-gray-200 h-64 rounded-2xl" />
          <div className="bg-gray-200 h-6 rounded w-3/4 mx-auto" />
          <div className="bg-gray-200 h-4 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Doctor info card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mb-8">
        <div className="flex flex-col md:flex-row gap-6 p-6">
          {/* Photo */}
          <div className="bg-secondary rounded-xl overflow-hidden w-full sm:w-48 md:w-64 h-48 sm:h-56 md:h-64 flex-shrink-0 mx-auto sm:mx-0">
            <img src={doctor.image} alt={`Dr. ${doctor.name}`} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Dr. {doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-text-secondary">{doctor.degree}</span>
                <span className="text-text-secondary">·</span>
                <span className="text-sm bg-secondary text-primary font-medium px-2.5 py-0.5 rounded-full">
                  {doctor.speciality}
                </span>
                <span className="text-sm bg-secondary text-text-secondary px-2.5 py-0.5 rounded-full">
                  {doctor.experience} exp.
                </span>
              </div>
            </div>

            {doctor.about && (
              <p className="text-sm text-text-secondary leading-relaxed">{doctor.about}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <span className="text-lg font-bold text-primary">${doctor.fees}</span>
              <span className="text-sm text-text-secondary">consultation fee</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${doctor.available ? 'bg-accent' : 'bg-gray-400'}`} />
              <span className={`text-sm font-medium ${doctor.available ? 'text-accent' : 'text-gray-400'}`}>
                {doctor.available ? 'Available for booking' : 'Currently unavailable'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slot booking section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Book an Appointment</h2>

        {!doctor.available || !hasAnySlots ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-text-secondary">No available slots at the moment. Please check back later.</p>
          </div>
        ) : (
          <>
            {/* Date row */}
            <div className="mb-6">
              <p className="text-sm font-medium text-text-secondary mb-3">Select a Date</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {weekSlots.map((day, idx) => (
                  <button
                    key={day.dateKey}
                    onClick={() => { setSelectedDateIdx(idx); setSelectedSlot(''); }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                      selectedDateIdx === idx
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            {currentDay && (
              <div className="mb-6">
                <p className="text-sm font-medium text-text-secondary mb-3">Select a Time</p>
                {currentDay.slots.length === 0 ? (
                  <p className="text-sm text-text-secondary">No slots available on this date.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {currentDay.slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                          selectedSlot === slot
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Book button */}
            <button
              onClick={handleBook}
              disabled={!selectedSlot || booking}
              className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-full px-8 py-3 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {booking ? 'Booking...' : 'Book Appointment'}
            </button>
          </>
        )}
      </div>

      {/* Related doctors */}
      <RelatedDoctors docId={docId} speciality={doctor.speciality} />
    </div>
  );
};

export default Appointment;

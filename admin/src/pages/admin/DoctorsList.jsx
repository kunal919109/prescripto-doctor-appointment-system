import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext.jsx';
import SkeletonRow from '../../components/SkeletonRow.jsx';

/**
 * Availability toggle button.
 * Visually renders as a pill-shaped switch.
 */
const AvailabilityToggle = ({ available, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    aria-label={available ? 'Mark as unavailable' : 'Mark as available'}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
      available ? 'bg-primary' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
        available ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const DoctorsList = () => {
  const { adminToken, backendUrl } = useAppContext();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  // Track which doctor IDs are currently being toggled to prevent double-clicks
  const [togglingIds, setTogglingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());

  // ── Fetch doctors ─────────────────────────────────────────────────────────

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/all-doctors`, {
        headers: { atoken: adminToken },
      });
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message || 'Failed to load doctors.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  }, [adminToken, backendUrl]);

  useEffect(() => {
    if (adminToken) fetchDoctors();
  }, [adminToken, fetchDoctors]);

  // ── Toggle availability ───────────────────────────────────────────────────

  const handleToggle = async (doctor) => {
    const { _id } = doctor;

    // Optimistic update
    setDoctors((prev) =>
      prev.map((d) => (d._id === _id ? { ...d, available: !d.available } : d))
    );
    setTogglingIds((prev) => new Set(prev).add(_id));

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/change-availability`,
        { docId: _id },
        { headers: { atoken: adminToken } }
      );

      if (!data.success) {
        // Revert on failure
        setDoctors((prev) =>
          prev.map((d) => (d._id === _id ? { ...d, available: doctor.available } : d))
        );
        toast.error(data.message || 'Failed to update availability.');
      }
    } catch (err) {
      // Revert on error
      setDoctors((prev) =>
        prev.map((d) => (d._id === _id ? { ...d, available: doctor.available } : d))
      );
      toast.error(err.response?.data?.message || 'Failed to update availability.');
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(_id);
        return next;
      });
    }
  };

  // ── Delete doctor ─────────────────────────────────────────────────────────

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Delete Dr. ${doctor.name}? This will also cancel their pending appointments.`)) return;

    const { _id } = doctor;
    setDeletingIds((prev) => new Set(prev).add(_id));

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/delete-doctor`,
        { docId: _id },
        { headers: { atoken: adminToken } }
      );

      if (data.success) {
        setDoctors((prev) => prev.filter((d) => d._id !== _id));
        toast.success('Doctor deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete doctor.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete doctor.');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(_id);
        return next;
      });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const SKELETON_COUNT = 6;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Doctors List</h1>
          <p className="text-text-secondary text-sm mt-1">
            {loading ? 'Loading…' : `${doctors.length} doctor${doctors.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDoctors}
          disabled={loading}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-14">#</th>
                <th className="px-4 py-3 text-left font-medium">Photo</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Specialty</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Fee</th>
                <th className="px-4 py-3 text-left font-medium">Available</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <SkeletonRow key={i} cols={8} />
                ))
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-text-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">👨‍⚕️</span>
                      <span className="font-medium">No doctors found</span>
                      <span className="text-xs">Add a doctor using the "Add Doctor" page.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                doctors.map((doctor, index) => (
                  <tr
                    key={doctor._id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Row number */}
                    <td className="px-4 py-3 text-text-secondary">{index + 1}</td>

                    {/* Photo */}
                    <td className="px-4 py-3">
                      <img
                        src={doctor.image}
                        alt={`${doctor.name} profile photo`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/40?text=Dr';
                        }}
                      />
                    </td>

                    {/* Name */}
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                      {doctor.name}
                    </td>

                    {/* Specialty */}
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {doctor.speciality}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-text-secondary">
                      <span className="truncate block max-w-[180px]" title={doctor.email}>
                        {doctor.email}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      ${Number(doctor.fees ?? 0).toFixed(2)}
                    </td>

                    {/* Availability toggle */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AvailabilityToggle
                          available={doctor.available}
                          loading={togglingIds.has(doctor._id)}
                          onClick={() => handleToggle(doctor)}
                        />
                        <span
                          className={`text-xs font-medium ${
                            doctor.available ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {doctor.available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(doctor)}
                        disabled={deletingIds.has(doctor._id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingIds.has(doctor._id) ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorsList;

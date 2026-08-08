import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useDoctorContext } from '../../context/DoctorContext.jsx';

// ── Loading Skeleton ──────────────────────────────────────────────────────────

const ProfileSkeleton = () => (
  <div className="animate-pulse space-y-6">
    {/* Header skeleton */}
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-5">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-3 bg-gray-200 rounded w-1/5" />
        </div>
      </div>
    </div>
    {/* Fields skeleton */}
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-24 flex-shrink-0" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

// ── Read-only Field Row ───────────────────────────────────────────────────────

const InfoRow = ({ label, value }) => (
  <div className="flex gap-4">
    <dt className="text-sm font-medium text-text-secondary w-36 flex-shrink-0">{label}</dt>
    <dd className="text-sm text-text-primary">{value || '—'}</dd>
  </div>
);

// ── Availability Badge ────────────────────────────────────────────────────────

const AvailabilityBadge = ({ available }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-green-500' : 'bg-red-500'}`}
    />
    {available ? 'Available' : 'Unavailable'}
  </span>
);

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate edit-form fields.
 * Returns an object of { fieldName: errorString }; empty object means no errors.
 */
const validateForm = ({ fees, addressLine1, addressLine2, about }) => {
  const errs = {};

  // fees: required, > 0, <= 99999.99
  const feeNum = Number(fees);
  if (fees === '' || fees === null || fees === undefined) {
    errs.fees = 'Consultation fee is required.';
  } else if (isNaN(feeNum) || feeNum <= 0) {
    errs.fees = 'Fee must be greater than 0.';
  } else if (feeNum > 99999.99) {
    errs.fees = 'Fee must not exceed $99,999.99.';
  }

  // address: combined line1 + line2 <= 200 chars
  const addrLen = (addressLine1 || '').length + (addressLine2 || '').length;
  if (addrLen > 200) {
    errs.address = `Address lines combined must not exceed 200 characters (currently ${addrLen}).`;
  }

  // about/bio: optional, max 500 chars
  if ((about || '').length > 500) {
    errs.about = `Bio must not exceed 500 characters (currently ${(about || '').length}).`;
  }

  return errs;
};

// ── Input class helper ────────────────────────────────────────────────────────

const inputCls = (hasError) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 transition-colors duration-200 ${
    hasError
      ? 'border-red-400 focus-visible:ring-red-200'
      : 'border-gray-300 focus-visible:ring-primary/30 focus:border-primary'
  }`;

const labelCls = 'block text-sm font-medium text-text-primary mb-1';
const errorCls = 'mt-1 text-xs text-red-500';

// ── DoctorProfile ─────────────────────────────────────────────────────────────

const DoctorProfile = () => {
  const { dToken, backendUrl, profileData, setProfileData } = useDoctorContext();

  const [loading, setLoading]   = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  // Edit-form local state
  const [form, setForm] = useState({
    fees: '',
    addressLine1: '',
    addressLine2: '',
    available: true,
    about: '',
  });

  // ── Fetch profile ────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!dToken) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/profile`, {
        headers: { dtoken: dToken },
      });
      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message || 'Failed to load profile.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [dToken, backendUrl, setProfileData]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Edit mode helpers ────────────────────────────────────────────────────

  const startEditing = () => {
    if (!profileData) return;
    setForm({
      fees: profileData.fees ?? '',
      addressLine1: profileData.address?.line1 ?? '',
      addressLine2: profileData.address?.line2 ?? '',
      available: profileData.available ?? true,
      about: profileData.about ?? '',
    });
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
  };

  // ── Field change handler ─────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setForm((prev) => ({ ...prev, [name]: newValue }));

    // Clear the relevant field error on change
    if (name === 'fees') {
      setErrors((prev) => ({ ...prev, fees: '' }));
    } else if (name === 'addressLine1' || name === 'addressLine2') {
      setErrors((prev) => ({ ...prev, address: '' }));
    } else if (name === 'about') {
      setErrors((prev) => ({ ...prev, about: '' }));
    }
  };

  // ── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/doctor/update-profile`,
        {
          fees: Number(form.fees),
          address: JSON.stringify({ line1: form.addressLine1.trim(), line2: form.addressLine2.trim() }),
          available: form.available,
          about: form.about.trim(),
        },
        { headers: { dtoken: dToken } }
      );

      if (data.success) {
        toast.success(data.message || 'Profile updated successfully!');
        await fetchProfile();
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading && !profileData) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your professional information</p>
        </div>
        <ProfileSkeleton />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-text-secondary">Could not load profile. Please try refreshing the page.</p>
        <button
          onClick={fetchProfile}
          className="mt-4 px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const addr = profileData.address ?? {};
  const addressDisplay = [addr.line1, addr.line2].filter(Boolean).join(', ') || '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Profile</h1>
          <p className="text-text-secondary text-sm mt-1">Manage your professional information</p>
        </div>
        {!isEditing && (
          <button
            onClick={startEditing}
            className="px-5 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors duration-200"
          >
            Edit
          </button>
        )}
      </div>

      {/* Doctor Info Card — photo, name, specialty, degree, experience (always read-only) */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-5">
          <img
            src={profileData.image || 'https://ui-avatars.com/api/?name=Doctor&background=5F6FFF&color=fff'}
            alt={`Dr. ${profileData.name ?? 'Doctor'} profile photo`}
            className="w-24 h-24 rounded-full object-cover border-4 border-secondary flex-shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-text-primary truncate">{profileData.name ?? '—'}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{profileData.speciality ?? '—'}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profileData.degree && (
                <span className="inline-block bg-secondary text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {profileData.degree}
                </span>
              )}
              {profileData.experience && (
                <span className="inline-block bg-secondary text-primary text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {profileData.experience}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable Fields Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">

        {isEditing ? (
          /* ── Edit Form ─────────────────────────────────────────────────── */
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <h3 className="text-base font-semibold text-text-primary mb-4">Edit Profile Details</h3>

            {/* Consultation Fee */}
            <div>
              <label htmlFor="fees" className={labelCls}>
                Consultation Fee ($) <span className="text-red-500">*</span>
              </label>
              <input
                id="fees"
                name="fees"
                type="number"
                min="0.01"
                max="99999.99"
                step="0.01"
                value={form.fees}
                onChange={handleChange}
                placeholder="e.g. 50"
                className={inputCls(!!errors.fees)}
                aria-describedby={errors.fees ? 'dp-fees-error' : undefined}
                aria-invalid={!!errors.fees}
              />
              {errors.fees && <p id="dp-fees-error" role="alert" className={errorCls}>{errors.fees}</p>}
            </div>

            {/* Address Line 1 */}
            <div>
              <label htmlFor="addressLine1" className={labelCls}>Address Line 1</label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                value={form.addressLine1}
                onChange={handleChange}
                placeholder="Street address"
                className={inputCls(!!errors.address)}
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label htmlFor="addressLine2" className={labelCls}>Address Line 2</label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                value={form.addressLine2}
                onChange={handleChange}
                placeholder="City, State, ZIP"
                className={inputCls(!!errors.address)}
                aria-describedby={errors.address ? 'dp-address-error' : undefined}
                aria-invalid={!!errors.address}
              />
              {errors.address && <p id="dp-address-error" role="alert" className={errorCls}>{errors.address}</p>}
              <p className="mt-1 text-xs text-text-secondary text-right">
                {(form.addressLine1.length + form.addressLine2.length)}/200 combined
              </p>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center justify-between py-1">
              <label htmlFor="available" className="text-sm font-medium text-text-primary cursor-pointer">
                Available for Appointments
              </label>
              <button
                type="button"
                id="available"
                role="switch"
                aria-checked={form.available}
                onClick={() => setForm((prev) => ({ ...prev, available: !prev.available }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  form.available ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span className="sr-only">Toggle availability</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                    form.available ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Bio / About */}
            <div>
              <label htmlFor="about" className={labelCls}>Bio / About</label>
              <textarea
                id="about"
                name="about"
                value={form.about}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                placeholder="Brief description about your background and expertise…"
                className={`${inputCls(!!errors.about)} resize-none`}
                aria-describedby={errors.about ? 'dp-about-error' : 'dp-about-count'}
              />
              <div className="flex justify-between items-start mt-1">
                {errors.about ? (
                  <p id="dp-about-error" role="alert" className={errorCls}>{errors.about}</p>
                ) : (
                  <span />
                )}
                <p id="dp-about-count" className={`text-xs ${form.about.length > 480 ? 'text-orange-500' : 'text-text-secondary'}`}>
                  {form.about.length}/500
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="px-5 py-2.5 border border-border text-text-secondary rounded-lg text-sm font-medium hover:bg-secondary disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* ── Read-only View ────────────────────────────────────────────── */
          <dl className="space-y-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Profile Details</h3>

            <InfoRow
              label="Consultation Fee"
              value={profileData.fees != null ? `$${Number(profileData.fees).toFixed(2)}` : '—'}
            />

            <InfoRow label="Address" value={addressDisplay} />

            {/* Availability — rendered as badge instead of plain text */}
            <div className="flex gap-4">
              <dt className="text-sm font-medium text-text-secondary w-36 flex-shrink-0">Availability</dt>
              <dd><AvailabilityBadge available={profileData.available} /></dd>
            </div>

            {/* Bio */}
            <div className="flex gap-4">
              <dt className="text-sm font-medium text-text-secondary w-36 flex-shrink-0">Bio</dt>
              <dd className="text-sm text-text-primary whitespace-pre-wrap">
                {profileData.about || '—'}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../../context/AppContext.jsx';

const SPECIALTIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
];

const EXPERIENCE_OPTIONS = Array.from({ length: 20 }, (_, i) => {
  const years = i + 1;
  return { value: `${years} ${years === 1 ? 'Year' : 'Years'}`, label: `${years} ${years === 1 ? 'Year' : 'Years'}` };
});

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  speciality: '',
  degree: '',
  experience: '1 Year',
  fees: '',
  about: '',
  addressLine1: '',
  addressLine2: '',
};

const REQUIRED_FIELDS = ['name', 'email', 'password', 'speciality', 'degree', 'fees'];

/**
 * Validate individual field values.
 * Returns an error string or empty string if valid.
 */
const validateField = (name, value) => {
  switch (name) {
    case 'name':
      if (!value.trim()) return 'Name is required.';
      if (value.trim().length < 2) return 'Name must be at least 2 characters.';
      return '';
    case 'email':
      if (!value.trim()) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address.';
      return '';
    case 'password':
      if (!value) return 'Password is required.';
      if (value.length < 8) return 'Password must be at least 8 characters.';
      return '';
    case 'speciality':
      if (!value) return 'Please select a specialty.';
      return '';
    case 'degree':
      if (!value.trim()) return 'Education/Degree is required.';
      return '';
    case 'fees':
      if (value === '' || value === undefined) return 'Consultation fee is required.';
      if (isNaN(Number(value)) || Number(value) <= 0) return 'Fee must be a positive number.';
      return '';
    default:
      return '';
  }
};

const AddDoctor = () => {
  const { adminToken, backendUrl } = useAppContext();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error on change for required fields
    if (REQUIRED_FIELDS.includes(name)) {
      const fieldError = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: fieldError }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setPhotoError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 5 MB.');
      return;
    }

    setPhotoError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validateAll = () => {
    const newErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });

    if (!photoFile) {
      setPhotoError('Profile photo is required.');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) return;

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('email', form.email.trim().toLowerCase());
    formData.append('password', form.password);
    formData.append('speciality', form.speciality);
    formData.append('degree', form.degree.trim());
    formData.append('experience', form.experience);
    formData.append('fees', form.fees);
    formData.append('about', form.about.trim());
    formData.append(
      'address',
      JSON.stringify({ line1: form.addressLine1.trim(), line2: form.addressLine2.trim() })
    );
    formData.append('image', photoFile);

    setSubmitting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/admin/add-doctor`, formData, {
        headers: { atoken: adminToken },
      });

      if (data.success) {
        toast.success(data.message || 'Doctor added successfully!');
        // Reset form
        setForm(INITIAL_FORM);
        setErrors({});
        setPhotoFile(null);
        setPhotoPreview(null);
        setPhotoError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(data.message || 'Failed to add doctor.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while adding the doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── UI Helpers ────────────────────────────────────────────────────────────

  const fieldClass = (name) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus-visible:ring-2 transition-colors duration-200 ${
      errors[name]
        ? 'border-red-400 focus-visible:ring-red-200'
        : 'border-gray-300 focus-visible:ring-primary/30 focus:border-primary'
    }`;

  const labelClass = 'block text-sm font-medium text-text-primary mb-1';
  const errorClass = 'mt-1 text-xs text-red-500';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Add Doctor</h1>
        <p className="text-text-secondary text-sm mt-1">Fill in the details to register a new doctor.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">

        {/* Profile Photo */}
        <div>
          <p className={labelClass}>Profile Photo <span className="text-red-500">*</span></p>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div
              className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0 cursor-pointer hover:border-primary transition-colors duration-150"
              onClick={() => fileInputRef.current?.click()}
              role="button"
              aria-label="Select profile photo"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile photo preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-3xl">📷</span>
                  <p className="text-xs text-text-secondary mt-1">Upload</p>
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:border-primary hover:text-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                {photoPreview ? 'Change Photo' : 'Choose Photo'}
              </button>
              <p className="text-xs text-text-secondary mt-1">JPEG, PNG or WebP · max 5 MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
            aria-label="Profile photo file input"
          />
          {photoError && <p className={errorClass}>{photoError}</p>}
        </div>

        {/* Name & Specialty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className={labelClass}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Dr. Jane Smith"
              className={fieldClass('name')}
              autoComplete="off"
              aria-describedby={errors.name ? 'add-doctor-name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p id="add-doctor-name-error" role="alert" className={errorClass}>{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="speciality" className={labelClass}>
              Specialty <span className="text-red-500">*</span>
            </label>
            <select
              id="speciality"
              name="speciality"
              value={form.speciality}
              onChange={handleChange}
              className={fieldClass('speciality')}
              aria-describedby={errors.speciality ? 'add-doctor-speciality-error' : undefined}
              aria-invalid={!!errors.speciality}
            >
              <option value="">— Select specialty —</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.speciality && <p id="add-doctor-speciality-error" role="alert" className={errorClass}>{errors.speciality}</p>}
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className={labelClass}>
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="doctor@example.com"
              className={fieldClass('email')}
              autoComplete="off"
              aria-describedby={errors.email ? 'add-doctor-email-error' : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p id="add-doctor-email-error" role="alert" className={errorClass}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className={labelClass}>
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className={fieldClass('password')}
              autoComplete="new-password"
              aria-describedby={errors.password ? 'add-doctor-password-error' : undefined}
              aria-invalid={!!errors.password}
            />
            {errors.password && <p id="add-doctor-password-error" role="alert" className={errorClass}>{errors.password}</p>}
          </div>
        </div>

        {/* Degree & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="degree" className={labelClass}>
              Education / Degree <span className="text-red-500">*</span>
            </label>
            <input
              id="degree"
              name="degree"
              type="text"
              value={form.degree}
              onChange={handleChange}
              placeholder="e.g. MBBS, MD"
              className={fieldClass('degree')}
              aria-describedby={errors.degree ? 'add-doctor-degree-error' : undefined}
              aria-invalid={!!errors.degree}
            />
            {errors.degree && <p id="add-doctor-degree-error" role="alert" className={errorClass}>{errors.degree}</p>}
          </div>

          <div>
            <label htmlFor="experience" className={labelClass}>Experience</label>
            <select
              id="experience"
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className={fieldClass('experience')}
            >
              {EXPERIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Consultation Fee */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fees" className={labelClass}>
              Consultation Fee ($) <span className="text-red-500">*</span>
            </label>
            <input
              id="fees"
              name="fees"
              type="number"
              min="1"
              step="0.01"
              value={form.fees}
              onChange={handleChange}
              placeholder="e.g. 50"
              className={fieldClass('fees')}
              aria-describedby={errors.fees ? 'add-doctor-fees-error' : undefined}
              aria-invalid={!!errors.fees}
            />
            {errors.fees && <p id="add-doctor-fees-error" role="alert" className={errorClass}>{errors.fees}</p>}
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="addressLine1" className={labelClass}>Address Line 1</label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="Street address"
              className={fieldClass('addressLine1')}
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className={labelClass}>Address Line 2</label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="City, State, ZIP"
              className={fieldClass('addressLine2')}
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="about" className={labelClass}>Bio / About</label>
          <textarea
            id="about"
            name="about"
            value={form.about}
            onChange={handleChange}
            rows={4}
            maxLength={500}
            placeholder="Brief description about the doctor's background and expertise…"
            className={`${fieldClass('about')} resize-none`}
          />
          <p className="mt-1 text-xs text-text-secondary text-right">
            {form.about.length}/500
          </p>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Adding Doctor…
              </>
            ) : (
              'Add Doctor'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDoctor;

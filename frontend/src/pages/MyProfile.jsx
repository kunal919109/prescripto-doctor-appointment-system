import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext.jsx';

const MyProfile = () => {
  const { token, backendUrl, userData, getUserData } = useAppContext();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: '',
    address: { line1: '', line2: '' },
  });

  const startEditing = () => {
    setForm({
      name: userData?.name || '',
      phone: userData?.phone === '0000000000' ? '' : (userData?.phone || ''),
      dob: userData?.dob === 'Not Selected' ? '' : (userData?.dob || ''),
      gender: userData?.gender === 'Not Selected' ? '' : (userData?.gender || ''),
      address: {
        line1: userData?.address?.line1 || '',
        line2: userData?.address?.line2 || '',
      },
    });
    setImageFile(null);
    setImagePreview(null);
    setErrors({});
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'line1' || name === 'line2') {
      setForm(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must not exceed 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length > 100) {
      errs.name = 'Name is required and must be 1–100 characters';
    }
    if (!form.phone) {
      errs.phone = 'Phone number is required';
    } else {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        errs.phone = 'Phone must be 7–15 digits';
      }
    }
    if (!form.dob) {
      errs.dob = 'Date of birth is required';
    } else if (new Date(form.dob) >= new Date()) {
      errs.dob = 'Date of birth must be in the past';
    }
    const addrLen = (form.address.line1 + form.address.line2).length;
    if (addrLen > 255) {
      errs.address = 'Address must not exceed 255 characters total';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('phone', form.phone);
      formData.append('dob', form.dob);
      formData.append('gender', form.gender || 'Not Selected');
      formData.append('address', JSON.stringify(form.address));
      if (imageFile) formData.append('image', imageFile);

      const { data } = await axios.post(
        `${backendUrl}/api/user/update-profile`,
        formData,
        { headers: { token, 'Content-Type': 'multipart/form-data' } }
      );

      if (data.success) {
        toast.success('Profile updated successfully!');
        await getUserData();
        setIsEditing(false);
        setImageFile(null);
        setImagePreview(null);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="animate-pulse space-y-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-text-primary">My Profile</h1>
        {!isEditing && (
          <button
            onClick={startEditing}
            className="border border-primary text-primary hover:bg-secondary text-sm font-medium rounded-lg px-5 py-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Edit Profile
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
        {/* Profile photo */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <img
              src={imagePreview || userData.image || 'https://ui-avatars.com/api/?name=User&background=5F6FFF&color=fff'}
              alt={`${userData.name || 'User'} profile photo`}
              className="w-24 h-24 rounded-full object-cover border-4 border-secondary"
            />
            {isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Change profile photo"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
              aria-label="Upload profile photo"
            />
          </div>
          <div>
            <p className="font-semibold text-text-primary text-lg">{userData.name}</p>
            <p className="text-sm text-text-secondary">{userData.email}</p>
            {isEditing && <p className="text-xs text-text-secondary mt-1">Click photo to change</p>}
          </div>
        </div>

        <hr className="border-border" />

        {isEditing ? (
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1.5">Full Name *</label>
              <input
                id="name" name="name" type="text" value={form.name} onChange={handleChange}
                aria-describedby={errors.name ? 'profile-name-error' : undefined}
                aria-invalid={!!errors.name}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200 ${errors.name ? 'border-error' : 'border-border'}`}
              />
              {errors.name && <p id="profile-name-error" role="alert" className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1.5">Phone Number *</label>
              <input
                id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="e.g. +1234567890"
                aria-describedby={errors.phone ? 'profile-phone-error' : undefined}
                aria-invalid={!!errors.phone}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200 ${errors.phone ? 'border-error' : 'border-border'}`}
              />
              {errors.phone && <p id="profile-phone-error" role="alert" className="mt-1 text-xs text-error">{errors.phone}</p>}
            </div>

            {/* DOB + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-text-primary mb-1.5">Date of Birth *</label>
                <input
                  id="dob" name="dob" type="date" value={form.dob} onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  aria-describedby={errors.dob ? 'profile-dob-error' : undefined}
                  aria-invalid={!!errors.dob}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200 ${errors.dob ? 'border-error' : 'border-border'}`}
                />
                {errors.dob && <p id="profile-dob-error" role="alert" className="mt-1 text-xs text-error">{errors.dob}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-1.5">Gender</label>
                <select
                  id="gender" name="gender" value={form.gender} onChange={handleChange}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-text-primary">Address</label>
              <div>
                <label htmlFor="line1" className="sr-only">Address line 1</label>
                <input id="line1" name="line1" type="text" value={form.address.line1} onChange={handleChange} placeholder="Address line 1"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200" />
              </div>
              <div>
                <label htmlFor="line2" className="sr-only">Address line 2</label>
                <input id="line2" name="line2" type="text" value={form.address.line2} onChange={handleChange} placeholder="Address line 2"
                  aria-describedby={errors.address ? 'profile-address-error' : undefined}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200" />
              </div>
              {errors.address && <p id="profile-address-error" role="alert" className="text-xs text-error">{errors.address}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave} disabled={saving}
                className="bg-primary hover:bg-primary-dark text-white font-semibold rounded-full px-8 py-2.5 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={cancelEditing}
                className="border border-border text-text-secondary hover:bg-secondary font-medium rounded-full px-6 py-2.5 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="space-y-4">
            {[
              { label: 'Email', value: userData.email },
              { label: 'Phone', value: userData.phone === '0000000000' ? '—' : userData.phone },
              { label: 'Date of Birth', value: userData.dob === 'Not Selected' ? '—' : userData.dob },
              { label: 'Gender', value: userData.gender === 'Not Selected' ? '—' : userData.gender },
              { label: 'Address', value: [userData.address?.line1, userData.address?.line2].filter(Boolean).join(', ') || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4">
                <dt className="text-sm font-medium text-text-secondary w-32 flex-shrink-0">{label}</dt>
                <dd className="text-sm text-text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
};

export default MyProfile;

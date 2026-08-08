import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import DoctorCard from '../components/DoctorCard.jsx';
import SkeletonCard from '../components/SkeletonCard.jsx';

const SPECIALITIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
];

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const { doctors, getDoctors } = useAppContext();

  const [filterSpec, setFilterSpec] = useState(speciality || '');
  const [loading, setLoading] = useState(doctors.length === 0);
  const [hasError, setHasError] = useState(false);

  // Sync URL param → filter state
  useEffect(() => {
    setFilterSpec(speciality || '');
  }, [speciality]);

  // Mark loading done once doctors arrive
  useEffect(() => {
    if (doctors.length > 0) {
      setLoading(false);
    }
  }, [doctors]);

  const handleRetry = useCallback(async () => {
    setHasError(false);
    setLoading(true);
    try {
      await getDoctors();
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, [getDoctors]);

  // Filter doctors client-side (case-insensitive)
  const filtered = filterSpec
    ? doctors.filter(d => d.speciality.toLowerCase() === filterSpec.toLowerCase())
    : doctors;

  const handleSpecFilter = (spec) => {
    const next = spec === filterSpec ? '' : spec;
    setFilterSpec(next);
    navigate(next ? `/doctors/${next}` : '/doctors', { replace: true });
    window.scrollTo(0, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Find a Doctor</h1>
        <p className="mt-2 text-text-secondary">Browse and book from our certified specialists.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Specialty filter — sidebar on desktop, chips on mobile */}
        <aside className="lg:w-56 flex-shrink-0">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">Specialty</h2>

          {/* Mobile: horizontal scroll chips */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleSpecFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                filterSpec === ''
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
              }`}
            >
              All
            </button>
            {SPECIALITIES.map(spec => (
              <button
                key={spec}
                onClick={() => handleSpecFilter(spec)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  filterSpec.toLowerCase() === spec.toLowerCase()
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-secondary border-border hover:border-primary hover:text-primary'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Desktop: vertical list */}
          <div className="hidden lg:flex flex-col gap-1">
            <button
              onClick={() => handleSpecFilter('')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                filterSpec === ''
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-secondary hover:text-primary'
              }`}
            >
              All Specialties
            </button>
            {SPECIALITIES.map(spec => (
              <button
                key={spec}
                onClick={() => handleSpecFilter(spec)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                  filterSpec.toLowerCase() === spec.toLowerCase()
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-secondary hover:text-primary'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </aside>

        {/* Doctor grid */}
        <div className="flex-1">
          {/* Error state */}
          {hasError && (
            <div className="text-center py-16">
              <p className="text-text-secondary mb-4">Failed to load doctors. Please try again.</p>
              <button
                onClick={handleRetry}
                className="bg-primary text-white font-semibold rounded-full px-6 py-2.5 hover:bg-primary-dark transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading skeletons — 8 cards */}
          {!hasError && loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Empty state */}
          {!hasError && !loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-semibold text-text-primary mb-2">
                {filterSpec ? 'No doctors found for this specialty.' : 'No doctors available yet.'}
              </p>
              {filterSpec && (
                <button
                  onClick={() => handleSpecFilter('')}
                  className="mt-4 text-primary font-medium hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {/* Doctor grid */}
          {!hasError && !loading && filtered.length > 0 && (
            <>
              <p className="text-sm text-text-secondary mb-4">
                {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
                {filterSpec ? ` for "${filterSpec}"` : ''}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(doc => (
                  <DoctorCard key={doc._id} doctor={doc} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;

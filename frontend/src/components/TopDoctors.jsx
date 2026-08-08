import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';
import DoctorCard from './DoctorCard.jsx';
import SkeletonCard from './SkeletonCard.jsx';

const TopDoctors = () => {
  const { doctors } = useAppContext();
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-primary">Top Doctors</h2>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            Highly rated professionals ready to help you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.length === 0
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : doctors.slice(0, 8).map(doc => <DoctorCard key={doc._id} doctor={doc} />)
          }
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => { navigate('/doctors'); window.scrollTo(0, 0); }}
            className="border border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-full px-8 py-3 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            View All Doctors
          </button>
        </div>
      </div>
    </section>
  );
};

export default TopDoctors;

import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';
import DoctorCard from './DoctorCard.jsx';

const RelatedDoctors = ({ docId, speciality }) => {
  const { doctors } = useAppContext();

  const related = doctors
    .filter(d => d._id !== docId && d.speciality === speciality && d.available)
    .slice(0, 5);

  if (related.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-6">Related Doctors</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {related.map(doc => (
          <DoctorCard key={doc._id} doctor={doc} />
        ))}
      </div>
    </div>
  );
};

export default RelatedDoctors;

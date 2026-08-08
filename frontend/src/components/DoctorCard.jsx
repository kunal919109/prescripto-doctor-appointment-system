import React from 'react';
import { useNavigate } from 'react-router-dom';

const DoctorCard = ({ doctor }) => {
  const navigate = useNavigate();

  const handleNavigate = () => { navigate(`/appointment/${doctor._id}`); window.scrollTo(0, 0); };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigate(); } }}
      aria-label={`View profile of Dr. ${doctor.name}, ${doctor.speciality}`}
      className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Doctor image */}
      <div className="bg-secondary overflow-hidden h-48">
        <img
          src={doctor.image}
          alt={`Dr. ${doctor.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Doctor info */}
      <div className="p-4 space-y-1.5">
        {/* Availability badge */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${doctor.available ? 'bg-accent' : 'bg-gray-400'}`} aria-hidden="true" />
          <span className={`text-xs font-medium ${doctor.available ? 'text-accent' : 'text-gray-400'}`}>
            {doctor.available ? 'Available' : 'Not Available'}
          </span>
        </div>

        {/* Name */}
        <h3 className="text-base font-semibold text-text-primary group-hover:text-primary transition-colors duration-200">
          Dr. {doctor.name}
        </h3>

        {/* Specialty */}
        <p className="text-sm text-text-secondary">{doctor.speciality}</p>

        {/* Fee */}
        <p className="text-sm font-medium text-primary">${doctor.fees} <span className="font-normal text-text-secondary">/ visit</span></p>
      </div>
    </div>
  );
};

export default DoctorCard;

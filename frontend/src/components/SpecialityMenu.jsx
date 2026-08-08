import React from 'react';
import { Link } from 'react-router-dom';

const SPECIALITIES = [
  { name: 'General physician', icon: '🩺' },
  { name: 'Gynecologist', icon: '👶' },
  { name: 'Dermatologist', icon: '🧴' },
  { name: 'Pediatricians', icon: '🧒' },
  { name: 'Neurologist', icon: '🧠' },
  { name: 'Gastroenterologist', icon: '🫃' },
];

const SpecialityMenu = () => (
  <section className="py-16 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-text-primary">Find by Speciality</h2>
        <p className="mt-3 text-text-secondary max-w-md mx-auto">
          Browse our trusted specialists and book your appointment in minutes.
        </p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide justify-center flex-wrap">
        {SPECIALITIES.map(({ name, icon }) => (
          <Link
            key={name}
            to={`/doctors/${name}`}
            className="flex flex-col items-center gap-3 p-5 bg-secondary rounded-2xl hover:bg-primary hover:text-white group transition-all duration-200 min-w-[120px] cursor-pointer border border-transparent hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <span className="text-3xl">{icon}</span>
            <span className="text-xs font-semibold text-text-primary group-hover:text-white text-center leading-tight">
              {name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default SpecialityMenu;

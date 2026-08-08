import React from 'react';
import { useNavigate } from 'react-router-dom';
import SpecialityMenu from '../components/SpecialityMenu.jsx';
import TopDoctors from '../components/TopDoctors.jsx';
import Banner from '../components/Banner.jsx';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary to-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Book Your Doctor<br />
                <span className="text-white/90">Appointment</span>
              </h1>
              <p className="mt-6 text-lg text-white/80 max-w-lg">
                Connect with certified specialists online or in-person.
                Find the right doctor and schedule in just a few clicks.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={() => { navigate('/doctors'); window.scrollTo(0, 0); }}
                  className="bg-white text-primary font-semibold rounded-full px-8 py-3.5 hover:bg-secondary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  Find Doctors
                </button>
                <button
                  onClick={() => { navigate('/about'); window.scrollTo(0, 0); }}
                  className="border-2 border-white text-white font-semibold rounded-full px-8 py-3.5 hover:bg-white/10 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 flex-wrap justify-center">
              {[
                { value: '100+', label: 'Doctors' },
                { value: '10K+', label: 'Patients' },
                { value: '50K+', label: 'Appointments' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white/10 backdrop-blur rounded-2xl p-5 text-center min-w-[90px]">
                  <p className="text-xl sm:text-2xl font-bold">{value}</p>
                  <p className="text-xs sm:text-sm text-white/80 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SpecialityMenu />
      <TopDoctors />
      <Banner />
    </div>
  );
};

export default Home;

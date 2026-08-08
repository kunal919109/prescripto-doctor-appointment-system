import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext.jsx';

const Banner = () => {
  const { token } = useAppContext();
  const navigate = useNavigate();

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-primary rounded-3xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between px-8 md:px-16 py-12 gap-8">
            <div className="text-white text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                Book Appointment<br />With 100+ Trusted Doctors
              </h2>
              <p className="mt-4 text-white/80 text-sm max-w-sm">
                Get quality healthcare at your fingertips. Secure, fast, and reliable booking.
              </p>
              {!token && (
                <button
                  onClick={() => { navigate('/login'); window.scrollTo(0, 0); }}
                  className="mt-6 bg-white text-primary font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors duration-200 inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                >
                  Create Account
                </button>
              )}
            </div>
            <div className="text-6xl md:text-8xl select-none" aria-hidden="true">🏥</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;

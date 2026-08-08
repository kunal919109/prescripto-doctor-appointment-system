import React from 'react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-text-primary mb-4">About Prescripto</h1>
        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
          We connect patients with trusted, certified doctors — making quality healthcare accessible to everyone.
        </p>
      </div>

      {/* Mission */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Prescripto was built to simplify the doctor appointment process. No more waiting on hold,
            no more guesswork — just a fast, transparent booking experience that puts patients in control.
          </p>
          <p className="text-text-secondary leading-relaxed">
            We partner with verified healthcare professionals across specialties to ensure you always
            get the right care at the right time.
          </p>
        </div>
        <div className="bg-secondary rounded-2xl p-10 text-center">
          <div className="text-6xl mb-4" aria-hidden="true">🏥</div>
          <p className="text-primary font-semibold text-lg">Healthcare, simplified.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
        {[
          { value: '100+', label: 'Verified Doctors', icon: '👨‍⚕️' },
          { value: '10,000+', label: 'Happy Patients', icon: '😊' },
          { value: '50,000+', label: 'Appointments Booked', icon: '📅' },
        ].map(({ value, label, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-6 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">{icon}</div>
            <p className="text-3xl font-bold text-primary mb-1">{value}</p>
            <p className="text-sm text-text-secondary">{label}</p>
          </div>
        ))}
      </div>

      {/* Why choose us */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">Why Choose Prescripto?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: '🔒', title: 'Secure & Private', desc: 'Your health data is encrypted and never shared without consent.' },
            { icon: '⚡', title: 'Instant Booking', desc: 'Book an appointment in under 2 minutes, any time of day.' },
            { icon: '💳', title: 'Easy Payments', desc: 'Pay securely online via Razorpay — no cash required.' },
            { icon: '🩺', title: 'Verified Doctors', desc: 'Every doctor on the platform is certified and background-checked.' },
            { icon: '📱', title: 'Mobile-Friendly', desc: 'Fully responsive design — works perfectly on any device.' },
            { icon: '🔔', title: 'Appointment Tracking', desc: 'View and manage all your appointments in one place.' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-border shadow-sm p-6">
              <div className="text-3xl mb-3" aria-hidden="true">{icon}</div>
              <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
              <p className="text-sm text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary rounded-3xl p-10 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Ready to book your first appointment?</h2>
        <p className="text-white/80 mb-6">Find a doctor and schedule in minutes.</p>
        <button
          onClick={() => { navigate('/doctors'); window.scrollTo(0, 0); }}
          className="bg-white text-primary font-semibold rounded-full px-8 py-3 hover:bg-secondary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Browse Doctors
        </button>
      </div>
    </div>
  );
};

export default About;

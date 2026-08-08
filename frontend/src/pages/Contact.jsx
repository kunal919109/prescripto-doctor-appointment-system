import React, { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-text-primary mb-4">Contact Us</h1>
        <p className="text-lg text-text-secondary max-w-xl mx-auto">
          Have a question or need help? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary">Get in Touch</h2>

          {[
            { icon: '📧', label: 'Email', value: 'support@prescripto.com' },
            { icon: '📞', label: 'Phone', value: '+1 (555) 000-0000' },
            { icon: '🕐', label: 'Hours', value: 'Mon–Fri, 9 AM – 6 PM' },
            { icon: '📍', label: 'Address', value: '123 Health Ave, Medical City, CA 90001' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
                <p className="text-sm text-text-primary mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
          {submitted ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Message sent!</h3>
              <p className="text-text-secondary text-sm">We'll get back to you within 24 hours.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                className="mt-6 text-primary font-medium hover:text-primary-dark transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-text-primary mb-1.5">Your Name</label>
                <input
                  id="contact-name" name="name" type="text" value={form.name} onChange={handleChange} required
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-text-primary mb-1.5">Email Address</label>
                <input
                  id="contact-email" name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-text-primary mb-1.5">Message</label>
                <textarea
                  id="contact-message" name="message" rows={5} value={form.message} onChange={handleChange} required
                  placeholder="How can we help you?"
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow duration-200 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-semibold rounded-full py-3 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;

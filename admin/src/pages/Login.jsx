import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAppContext } from '../context/AppContext.jsx';
import { useDoctorContext } from '../context/DoctorContext.jsx';

const Login = () => {
  const navigate = useNavigate();
  const { backendUrl, adminToken, setAdminToken } = useAppContext();
  const { dToken, setDToken } = useDoctorContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (adminToken) {
      navigate('/admin-dashboard', { replace: true });
    } else if (dToken) {
      navigate('/doctor-dashboard', { replace: true });
    }
  }, [adminToken, dToken, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
       try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/login`,
        {
          email,
          password,
        }
      );

      console.log("ADMIN LOGIN RESPONSE:", data);

      if (data.success) {
        setAdminToken(data.token);
        navigate("/admin-dashboard");
        return;
      }

      console.log("ADMIN LOGIN FAILED:", data);

    } catch (adminErr) {
      console.log(
        "ADMIN LOGIN ERROR:",
        adminErr.response?.data || adminErr.message
      );
    }
      // Fall back to doctor login
      try {
        const { data } = await axios.post(`${backendUrl}/api/doctor/login`, {
          email,
          password,
        });

        if (data.success) {
          setDToken(data.token);
          navigate('/doctor-dashboard');
          return;
        }

        // success: false but no exception
        toast.error(data.message || 'Invalid credentials. Please try again.');
      } catch (doctorErr) {
        const message =
          doctorErr.response?.data?.message ||
          'Invalid credentials. Please try again.';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            <span className="text-primary">Prescripto</span> Admin
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            Sign in to manage the platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-transparent transition-shadow duration-200"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-text-primary mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-border rounded-lg text-sm text-text-primary placeholder-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-transparent transition-shadow duration-200"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

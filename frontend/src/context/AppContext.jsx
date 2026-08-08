import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const currencySymbol = '$';

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [doctors, setDoctors] = useState([]);
  const [userData, setUserData] = useState(null);

  // Fetch all available doctors (public endpoint)
  const getDoctors = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/doctor/list`);
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load doctors. Please try again.');
    }
  };

  // Fetch authenticated patient's profile
  const getUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/get-profile`, {
        headers: { token },
      });
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load profile.');
    }
  };

  // Persist token to localStorage whenever it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      getUserData();
    } else {
      localStorage.removeItem('token');
      setUserData(null);
    }
  }, [token]);

  // Fetch doctors on mount
  useEffect(() => {
    getDoctors();
  }, []);

  const value = {
    token,
    setToken,
    doctors,
    userData,
    setUserData,
    getDoctors,
    getUserData,
    backendUrl,
    currencySymbol,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
export default AppContextProvider;

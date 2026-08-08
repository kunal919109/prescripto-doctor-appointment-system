import React, { createContext, useContext, useState } from 'react';

export const DoctorContext = createContext();

/**
 * Doctor context — stores the doctor JWT token and doctor profile data.
 */
const DoctorContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [dToken, setDTokenState] = useState(
    localStorage.getItem('dToken') || ''
  );
  const [profileData, setProfileData] = useState(null);

  const setDToken = (token) => {
    setDTokenState(token);
    if (token) {
      localStorage.setItem('dToken', token);
    } else {
      localStorage.removeItem('dToken');
      setProfileData(null);
    }
  };

  return (
    <DoctorContext.Provider value={{ backendUrl, dToken, setDToken, profileData, setProfileData }}>
      {children}
    </DoctorContext.Provider>
  );
};

export const useDoctorContext = () => useContext(DoctorContext);
export default DoctorContextProvider;

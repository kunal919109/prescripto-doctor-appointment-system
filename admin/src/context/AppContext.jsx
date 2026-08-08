import React, { createContext, useContext, useState } from 'react';

export const AppContext = createContext();

/**
 * Admin context — stores the admin JWT token.
 */
const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem('aToken') || ''
  );

  const handleSetAdminToken = (token) => {
    setAdminToken(token);
    if (token) {
      localStorage.setItem('aToken', token);
    } else {
      localStorage.removeItem('aToken');
    }
  };

  return (
    <AppContext.Provider value={{ backendUrl, adminToken, setAdminToken: handleSetAdminToken }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
export default AppContextProvider;

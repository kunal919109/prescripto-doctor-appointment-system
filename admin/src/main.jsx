import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import AppContextProvider from './context/AppContext.jsx';
import DoctorContextProvider from './context/DoctorContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <DoctorContextProvider>
          <ToastContainer position="top-right" autoClose={3000} />
          <App />
        </DoctorContextProvider>
      </AppContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);

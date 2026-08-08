import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import AppContextProvider from './context/AppContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppContextProvider>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);

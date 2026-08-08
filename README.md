# 🏥 Prescripto — Doctor Appointment Booking System

A full-stack **Doctor Appointment Booking System** built using the **MERN Stack**, designed to simplify the process of finding doctors, booking appointments, and managing doctor and appointment information.

The project includes separate interfaces for **Patients, Doctors, and Administrators**, with a RESTful backend and MongoDB database.

---

## 🚀 Live Demo

### 👤 Patient / User Application

🔗 https://prescripto-frontend-q628.onrender.com

### 🛠️ Admin Panel

🔗 https://prescripto-admin-ymdq.onrender.com

### ⚙️ Backend API

🔗 https://prescripto-backend-cd8h.onrender.com

---

## 📌 Project Overview

Prescripto is a web-based healthcare appointment platform that allows patients to browse available doctors and book appointments online.

The system also provides an **Admin Panel** for managing doctors and appointments, while doctors can manage their profiles and appointments through the doctor dashboard.

The application follows a **role-based architecture** where different users have access to different functionalities.

---

## ✨ Key Features

### 👤 Patient Features

* User registration and login
* Secure authentication
* Browse available doctors
* View doctor information
* Book doctor appointments
* View booked appointments
* Manage user profile
* Cancel appointments
* Responsive user interface

### 👨‍⚕️ Doctor Features

* Doctor login
* Doctor dashboard
* View appointments
* Manage doctor profile
* View appointment information
* Role-based access to doctor routes

### 🛠️ Admin Features

* Admin authentication
* Admin dashboard
* Add new doctors
* Manage doctor list
* View all appointments
* Doctor management
* Appointment management
* Role-based admin routes

---

## 🧑‍💻 Tech Stack

### 🎨 Frontend

![React.js](https://img.shields.io/badge/React.js-61DAFB?style=for-the-badge\&logo=react\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-CA4245?style=for-the-badge\&logo=react-router\&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge\&logo=axios\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)

### ⚙️ Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge\&logo=express\&logoColor=white)
![REST API](https://img.shields.io/badge/REST_API-02569B?style=for-the-badge)
![JWT](https://img.shields.io/badge/JWT_Authentication-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)
![CORS](https://img.shields.io/badge/CORS-4CAF50?style=for-the-badge)

### 🗄️ Database

![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)
![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)

### ☁️ Deployment & Tools

![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge\&logo=render\&logoColor=black)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)



## 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │   MongoDB Atlas  │
                    │    Database      │
                    └────────▲─────────┘
                             │
                             │
                    ┌────────┴─────────┐
                    │     Backend      │
                    │ Node.js + Express│
                    │      REST API    │
                    └────────▲─────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
                 ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │ User Frontend   │     │  Admin Panel    │
        │ React + Vite    │     │ React + Vite    │
        └─────────────────┘     └─────────────────┘
```

---

## 🔐 Authentication & Authorization

Prescripto implements role-based authentication for different types of users.

### Authentication Flow

```text
User/Admin/Doctor Login
          ↓
      Credentials
          ↓
      Backend API
          ↓
   Authentication Check
          ↓
      JWT Token
          ↓
   Authorized Dashboard
```

Protected routes prevent unauthorized users from accessing admin and doctor-specific pages.

---

## 🛣️ Important Routes

### Patient

```text
/login
/register
/doctors
/my-profile
/my-appointments
```

### Admin

```text
/admin-dashboard
/add-doctor
/doctor-list
/all-appointments
```

### Doctor

```text
/doctor-dashboard
/doctor-appointments
/doctor-profile
```

---

## 📂 Project Structure

```text
Prescripto/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── assets/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── admin/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── config/
    ├── server.js
    └── package.json
```

---

## ⚙️ Environment Variables

### Frontend

Create a `.env` file:

```env
VITE_BACKEND_URL=https://prescripto-backend-cd8h.onrender.com
```

### Admin

Create a `.env` file:

```env
VITE_BACKEND_URL=https://prescripto-backend-cd8h.onrender.com
```

### Backend

Example:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=10000
```

> ⚠️ Never commit `.env` files or secret credentials to GitHub.

---

## 💻 Local Installation

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate into the project

```bash
cd Prescripto
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Start Backend

```bash
npm start
```

---

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

---

### 6. Install Admin Dependencies

Open another terminal:

```bash
cd admin
npm install
npm run dev
```

---

## 🌐 Production Deployment

The application is deployed using **Render**.

### Backend

```text
https://prescripto-backend-cd8h.onrender.com
```

### Frontend

```text
https://prescripto-frontend-q628.onrender.com
```

### Admin Panel

```text
https://prescripto-admin-ymdq.onrender.com
```

React Router rewrite rules are configured for the deployed frontend applications to support direct route access and page refreshes.

---

## 🔄 Application Workflow

```text
Patient
   │
   ├── Register / Login
   │
   ├── Browse Doctors
   │
   ├── Select Doctor
   │
   ├── Book Appointment
   │
   └── Manage Appointments


Admin
   │
   ├── Login
   │
   ├── View Dashboard
   │
   ├── Add Doctor
   │
   ├── Manage Doctors
   │
   └── Manage Appointments


Doctor
   │
   ├── Login
   │
   ├── View Dashboard
   │
   ├── View Appointments
   │
   └── Manage Profile
```

---

## 🛡️ Security

The project includes:

* JWT-based authentication
* Role-based route protection
* Protected API routes
* Environment variables for sensitive configuration
* CORS configuration
* Secure separation of User, Doctor and Admin functionality

---

## 📱 Responsive Design

The application is designed to provide a responsive experience across:

* 💻 Desktop
* 📱 Mobile
* 📟 Tablet

---

## 📸 Screenshots





## 📸 Screenshots

<table>
<tr>
<td><img src="screenshots/homepage.png.png" width="500"></td>
<td><img src="screenshots/doctorslist.png.png" width="500"></td>
</tr>
<tr>
<td><img src="screenshots/admindashboard.png.png" width="500"></td>
<td><img src="screenshots/appoinmnets.png.png" width="500"></td>
</tr>
<tr>
<td><img src="screenshots/doctormanagement.png.png" width="500"></td>
<td><img src="screenshots/doctorsdetails.png" width="500"></td>
</tr>
</table>
```

---

## 🧪 Testing

The following workflows were tested in the deployed application:

* User registration
* User login
* Doctor browsing
* Appointment booking
* Appointment management
* Admin login
* Doctor management
* Appointment management
* Doctor login
* Doctor dashboard
* Protected routes
* Logout
* Page refresh on protected routes

---

## 🔮 Future Improvements

* Online payment integration
* Email/SMS appointment notifications
* Doctor availability scheduling
* Video consultation
* Prescription management
* Advanced admin analytics
* Search and filtering
* Appointment reminders
* Cloud image storage
* Improved security and monitoring

---

## 🎯 Learning Outcomes

Through this project, I gained practical experience in:

* Full-stack MERN development
* REST API development
* React component architecture
* Authentication and authorization
* MongoDB database management
* API integration using Axios
* Role-based access control
* React Router
* Environment variable management
* Git and GitHub
* Production deployment
* Debugging deployment and routing issues

---

## 👨‍💻 Author

### Kunal Kasar

Computer Engineering Student | Full-Stack Developer

Interested in:

* MERN Stack
* Software Development
* Data Structures & Algorithms
* Cloud Computing
* Artificial Intelligence

---


## ⭐ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.


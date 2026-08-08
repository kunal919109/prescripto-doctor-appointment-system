# Implementation Plan: Prescripto Doctor Appointment Booking System

## Overview

This implementation plan covers all 30 tasks required to build Prescripto — a full-stack MERN Doctor Appointment Booking System. Tasks are organized across 6 phases: Project Setup, Backend Models & Middleware, Backend Controllers & Routes, Patient Portal Frontend, Admin Panel Frontend, and Integration & Polish. Each task is independently implementable given its listed dependencies.

## Tasks

### Phase 1: Project Setup & Configuration

- [x] 1. Initialize Backend Project
  - Description: Create the backend Express application entry point with all required middleware (CORS, JSON body parsing), route mounting, and global error handler. Set up the Mongoose connection module and document all required environment variables.
  - Files: backend/package.json, backend/server.js, backend/config/mongodb.js, backend/.env.example
  - Requirements: R1, R2, R3, R16
  - Dependencies: none

- [x] 2. Initialize Patient Portal (frontend)
  - Description: Scaffold the frontend React + Vite application. Install and configure Tailwind CSS with the custom Prescripto color palette (primary: #5F6FFF, secondary: #F0F4FF, accent: #00C8A0) and Inter font. Install axios, react-router-dom, and react-toastify. Document required environment variables.
  - Files: frontend/package.json, frontend/tailwind.config.js, frontend/index.html, frontend/src/index.css, frontend/src/main.jsx, frontend/vite.config.js, frontend/.env.example
  - Requirements: R18
  - Dependencies: none

- [x] 3. Initialize Admin Panel (admin)
  - Description: Scaffold the admin React + Vite application using the same dependency set and Tailwind configuration as the patient portal. Document required environment variables.
  - Files: admin/package.json, admin/tailwind.config.js, admin/index.html, admin/src/index.css, admin/src/main.jsx, admin/vite.config.js, admin/.env.example
  - Requirements: R18
  - Dependencies: none

### Phase 2: Backend — Models & Middleware

- [x] 4. Create Mongoose Models
  - Description: Implement all three Mongoose schemas. userModel.js for Patients (name, email, password, image, address, gender, dob, phone). doctorModel.js with slots_booked as a plain Object field and minimize: false to preserve empty objects. appointmentModel.js with userData and docData snapshot fields that capture state at booking time.
  - Files: backend/models/userModel.js, backend/models/doctorModel.js, backend/models/appointmentModel.js
  - Requirements: R1, R2, R7, R13
  - Dependencies: 1

- [x] 5. Create Auth Middleware
  - Description: Implement three JWT-verification middleware functions. authUser.js reads the "token" header, verifies the JWT, confirms role === "patient", and attaches req.userId. authDoctor.js reads the "dtoken" header, confirms role === "doctor", and attaches req.docId. authAdmin.js reads the "atoken" header and confirms role === "admin". All return 401 for missing/expired tokens and 403 for wrong-role tokens.
  - Files: backend/middleware/authUser.js, backend/middleware/authDoctor.js, backend/middleware/authAdmin.js
  - Requirements: R16
  - Dependencies: 1

- [x] 6. Create Multer and Cloudinary Utilities
  - Description: Implement Multer with memoryStorage, a fileFilter accepting only image/jpeg, image/png, and image/webp, and a 5 MB size limit. Implement the Cloudinary configuration module and an uploadToCloudinary(buffer, options) helper that streams the buffer using upload_stream and returns the Cloudinary result including secure_url.
  - Files: backend/middleware/multer.js, backend/utils/cloudinary.js
  - Requirements: R17
  - Dependencies: 1

### Phase 3: Backend — Controllers & Routes

- [x] 7. Admin Controller — Doctor Management
  - Description: Implement adminLogin (compare credentials against env vars ADMIN_EMAIL/ADMIN_PASSWORD, return JWT with role: "admin"). Implement addDoctor (validate all required fields, upload profile photo to Cloudinary, hash password with bcrypt salt rounds 10, save doctor document). Implement allDoctors (return all doctors, password field excluded). Implement changeAvailability (toggle doctor.available and save). Wire all four handlers into adminRoute.js.
  - Files: backend/controllers/adminController.js, backend/routes/adminRoute.js
  - Requirements: R3, R13
  - Dependencies: 4, 5, 6

- [x] 8. Admin Controller — Appointments and Dashboard
  - Description: Implement appointmentsAdmin (return all appointments sorted by date descending with userData and docData populated). Implement appointmentCancelAdmin (verify status is "pending", set cancelled: true, release the slot from doctor.slots_booked). Implement adminDashboard (aggregate total doctor count, patient count, appointment count, and return the 5 most recent appointments). Add these handlers to the existing adminController.js and adminRoute.js.
  - Files: backend/controllers/adminController.js, backend/routes/adminRoute.js
  - Requirements: R14, R15
  - Dependencies: 7

- [x] 9. Doctor Controller — Auth Profile and Dashboard
  - Description: Implement loginDoctor (bcrypt.compare credentials, return JWT with role: "doctor"; enforce in-memory rate limiting — block after 5 failed attempts within 15 minutes, return 429). Implement doctorList (public endpoint returning only available doctors with password excluded). Implement doctorProfile (return doctor document without password). Implement updateDoctorProfile (validate fee > 0, bio <= 500 chars, address <= 200 chars, update fields). Implement doctorDashboard (sum fees for completed appointments, count totals, return 5 latest appointments). Wire all handlers into doctorRoute.js.
  - Files: backend/controllers/doctorController.js, backend/routes/doctorRoute.js
  - Requirements: R2, R5, R11, R12
  - Dependencies: 4, 5

- [x] 10. Doctor Controller — Appointment Management
  - Description: Implement appointmentsDoctor (return all appointments where docId matches req.docId, sorted by date descending). Implement appointmentComplete (verify appointment belongs to req.docId, verify status is "pending", set isCompleted: true; return 403 if not owner, 400 if wrong status). Implement appointmentCancelDoctor (verify ownership and pending status, set cancelled: true, release slot from doctor.slots_booked; return 403/400 on violations). Add handlers to existing doctorController.js and doctorRoute.js.
  - Files: backend/controllers/doctorController.js, backend/routes/doctorRoute.js
  - Requirements: R10
  - Dependencies: 9

- [x] 11. User Controller — Auth and Profile
  - Description: Implement registerUser (validate name 1-100 chars, password 8-128 chars, unique email; hash password with bcrypt; create user; return JWT with role: "patient"). Implement loginUser (bcrypt.compare, return JWT with role: "patient"; return 401 for invalid credentials without specifying which field is wrong). Implement getProfile (return user document without password field). Implement updateProfile (validate name, phone 7-15 digits, dob is a past date, address <= 255 chars; handle optional image upload to Cloudinary; update and return updated user). Wire all handlers into userRoute.js.
  - Files: backend/controllers/userController.js, backend/routes/userRoute.js
  - Requirements: R1, R4
  - Dependencies: 4, 5, 6

- [x] 12. User Controller — Appointment Booking and Management
  - Description: Implement bookAppointment (check doctor.available, verify slot is not in doctor.slots_booked[slotDate], check for duplicate booking by same patient, create appointment with userData/docData snapshots, atomically mark slot as booked using $set; return 409 on slot conflict or duplicate). Implement listAppointments (return patient appointments sorted by date descending). Implement cancelAppointment (verify req.userId matches appointment.userId, verify status is "pending", set cancelled: true, release slot; return 403/400 on violations). Add handlers to userController.js and userRoute.js.
  - Files: backend/controllers/userController.js, backend/routes/userRoute.js
  - Requirements: R7, R8
  - Dependencies: 11

- [x] 13. User Controller — Razorpay Payment
  - Description: Implement paymentRazorpay (verify appointment belongs to req.userId, verify payment is false and cancelled is false; create Razorpay order with appointment.amount; return order id, amount, and currency; return 400 if already paid/cancelled, 502 if Razorpay API fails). Implement verifyRazorpay (reconstruct the HMAC-SHA256 signature from razorpay_order_id + "|" + razorpay_payment_id using RAZORPAY_KEY_SECRET; compare with razorpay_signature; set appointment.payment = true on match; return 400 on mismatch). Add handlers to userController.js and userRoute.js. Ensure RAZORPAY_KEY_SECRET is read only from server-side env and never returned in any response.
  - Files: backend/controllers/userController.js, backend/routes/userRoute.js
  - Requirements: R9
  - Dependencies: 12

### Phase 4: Patient Portal Frontend

- [x] 14. Patient Portal — App Shell and Context
  - Description: Create AppContext.jsx providing token state (read from localStorage on init), setToken, doctors array, userData object, backendUrl (from VITE_BACKEND_URL), currencySymbol ("$"), getDoctors() (fetches /api/doctor/list), and getUserData() (fetches /api/user/get-profile with auth header). Update main.jsx to wrap the app in BrowserRouter, AppContextProvider, and ToastContainer. Implement Navbar.jsx as a sticky header with backdrop-blur, logo, navigation links, a login/profile dropdown that shows avatar and name when authenticated, and a hamburger menu for mobile. Implement Footer.jsx with site links and copyright.
  - Files: frontend/src/context/AppContext.jsx, frontend/src/main.jsx, frontend/src/components/Navbar.jsx, frontend/src/components/Footer.jsx
  - Requirements: R1, R5, R18
  - Dependencies: 2, 9

- [x] 15. Patient Portal — Home Page
  - Description: Create Home.jsx assembling SpecialityMenu, TopDoctors, and Banner sections. Create SpecialityMenu.jsx as a horizontally scrollable row of specialty filter buttons each showing an icon and label, navigating to /doctors/:speciality on click. Create TopDoctors.jsx fetching doctors from context and rendering the top 8 in a responsive grid using DoctorCard. Create DoctorCard.jsx showing the doctor photo, name, specialty, consultation fee, an availability badge, and a hover scale/shadow transition of 300ms or less. Create Banner.jsx as a full-width CTA section. Create SkeletonCard.jsx with animate-pulse blocks matching DoctorCard dimensions for use during loading.
  - Files: frontend/src/pages/Home.jsx, frontend/src/components/SpecialityMenu.jsx, frontend/src/components/TopDoctors.jsx, frontend/src/components/DoctorCard.jsx, frontend/src/components/Banner.jsx, frontend/src/components/SkeletonCard.jsx
  - Requirements: R5, R18
  - Dependencies: 14

- [x] 16. Patient Portal — Doctor Listing and Filter
  - Description: Create Doctors.jsx that reads the :speciality URL param and syncs it with a local filter state. Render a specialty filter sidebar on desktop and chip row on mobile. Filter the doctors array from context client-side. Show a SkeletonCard grid while doctors are loading. Show "No doctors found for this specialty." when the filtered list is empty. Show a user-friendly error message with a Retry button if the API call in AppContext fails.
  - Files: frontend/src/pages/Doctors.jsx
  - Requirements: R5
  - Dependencies: 15

- [x] 17. Patient Portal — Doctor Appointment Page
  - Description: Create Appointment.jsx that loads the doctor by :docId from context. Display doctor photo, name, specialty, experience, education, bio, and consultation fee. Implement client-side slot generation matching the backend algorithm (09:00-20:30, 30-min intervals, 7-day window, skip past slots for today, 12-hour format labels). Group slots by date and render as selectable buttons with visually distinct selected state (filled background). Enable the "Book Appointment" button only when a slot is selected. Disable the button and show "No slots available" when the slot list is empty. On booking submit POST /api/user/book-appointment with auth header, show toast on error, navigate to /my-appointments on success. Create RelatedDoctors.jsx showing up to 5 other doctors of the same specialty.
  - Files: frontend/src/pages/Appointment.jsx, frontend/src/components/RelatedDoctors.jsx
  - Requirements: R6, R7
  
  
  - Dependencies: 14, 12

- [x] 18. Patient Portal — Login and Register Page
  - Description: Create Login.jsx with a toggle between "Login" and "Register" form states. The register form collects name, email, and password; the login form collects email and password. On success store the JWT in localStorage and update AppContext token via setToken. Redirect to home ("/") on success without a full page reload. Display field-specific validation error messages inline below each field. Show a spinner on the submit button while the request is in flight.
  - Files: frontend/src/pages/Login.jsx
  - Requirements: R1
  - Dependencies: 11, 14

- [x] 19. Patient Portal — My Appointments Page
  - Description: Create MyAppointments.jsx that fetches GET /api/user/appointments with the auth token and lists all patient appointments sorted by date descending. Each row shows doctor photo, name, specialty, appointment date, time slot, a status badge (Paid / Completed / Cancelled), and fee formatted to two decimal places with currency symbol. For pending and unpaid appointments show a "Pay Now" button that opens the Razorpay checkout modal using the order returned by /api/user/payment-razorpay, then calls /api/user/verifyRazorpay and refreshes the list on success. For pending appointments show a "Cancel" button that opens a ConfirmDialog before calling /api/user/cancel-appointment. Create ConfirmDialog.jsx as a reusable modal with confirm and dismiss actions.
  - Files: frontend/src/pages/MyAppointments.jsx, frontend/src/components/ConfirmDialog.jsx
  - Requirements: R8, R9
  - Dependencies: 13, 14, 17

- [x] 20. Patient Portal — My Profile Page
  - Description: Create MyProfile.jsx that fetches the patient profile via getUserData() from AppContext. Display profile photo (with a click-to-upload overlay), name, email, phone, dob, gender, and address in a read-only view. Provide an "Edit" button that switches to an editable form for name (1-100 chars), phone (7-15 digits), dob (past date), gender (select), and address (255 chars max). Photo upload uses a hidden file input that POSTs multipart/form-data to /api/user/update-profile. Show inline validation errors per field. On success call getUserData() to refresh context and show a success toast.
  - Files: frontend/src/pages/MyProfile.jsx
  - Requirements: R4
  - Dependencies: 11, 14

- [x] 21. Patient Portal — About and Contact Pages and Route Wiring
  - Description: Create About.jsx with a platform about section covering mission, how it works, and team. Create Contact.jsx with contact details and an inquiry form. Update main.jsx to wire all routes: / (Home), /doctors (Doctors), /doctors/:speciality (Doctors), /appointment/:docId (Appointment), /my-appointments (MyAppointments), /my-profile (MyProfile), /login (Login), /about (About), /contact (Contact). Redirect unauthenticated users attempting to access /my-appointments or /my-profile to /login.
  - Files: frontend/src/pages/About.jsx, frontend/src/pages/Contact.jsx, frontend/src/main.jsx
  - Requirements: R18
  - Dependencies: 14

### Phase 5: Admin Panel Frontend

- [x] 22. Admin Panel — App Shell and Context
  - Description: Create AppContext.jsx providing adminToken state (read from localStorage on init) and setAdminToken. Create DoctorContext.jsx providing dToken state and setDToken. Update main.jsx to wrap the app in BrowserRouter, both context providers, and ToastContainer. Create Navbar.jsx with the portal name, the active user email, and a Logout button that clears the relevant token and redirects to /login. Create Sidebar.jsx that reads both context values and renders admin navigation links (Dashboard, Appointments, Add Doctor, Doctors List) when adminToken is set, or doctor navigation links (Dashboard, Appointments, Profile) when dToken is set. Create SkeletonRow.jsx with animate-pulse columns matching the appointment table layout.
  - Files: admin/src/context/AppContext.jsx, admin/src/context/DoctorContext.jsx, admin/src/main.jsx, admin/src/components/Navbar.jsx, admin/src/components/Sidebar.jsx, admin/src/components/SkeletonRow.jsx
  - Requirements: R3, R2, R18
  - Dependencies: 3

- [x] 23. Admin Panel — Login Page
  - Description: Create Login.jsx with a single email and password form. On submit, if the email matches VITE_ADMIN_EMAIL try POST /api/admin/login first; on success store the admin token and navigate to /admin-dashboard. If the admin request fails or email does not match, fall back to POST /api/doctor/login; on success store the doctor token and navigate to /doctor-dashboard. Display a user-friendly error toast for invalid credentials. Show a spinner on the submit button while any request is in flight.
  - Files: admin/src/pages/Login.jsx
  - Requirements: R2, R3
  - Dependencies: 7, 9, 22

- [x] 24. Admin Panel — Admin Dashboard and Appointments
  - Description: Create admin/Dashboard.jsx that fetches GET /api/admin/dashboard with the atoken header and renders three stat cards (total Doctors, total Patients, total Appointments) and a table of the 5 most recent appointments (patient name, doctor name, date, fee, status). Show SkeletonRow while loading. Show empty state when no appointments exist. On API failure display a per-card error indicator without blocking the rest of the dashboard. Create admin/AllAppointments.jsx that fetches GET /api/admin/appointments and renders a full table with columns for patient name, doctor name, specialty, date, time, fee, and status. Add a Cancel button for pending appointments that opens a ConfirmDialog before calling POST /api/admin/cancel-appointment. Show SkeletonRow during load and empty state when the list is empty.
  - Files: admin/src/pages/admin/Dashboard.jsx, admin/src/pages/admin/AllAppointments.jsx
  - Requirements: R14, R15
  - Dependencies: 8, 22

- [x] 25. Admin Panel — Doctor Management
  - Description: Create admin/AddDoctor.jsx with a form containing name, specialty (select from predefined list), email, password, consultation fee, experience in years, education/degree, address line 1, address line 2, bio, and profile photo upload. On submit POST multipart/form-data to /api/admin/add-doctor with the atoken header. Show inline field validation errors. Show a success toast and reset the form on success. Create admin/DoctorsList.jsx that fetches GET /api/admin/all-doctors and renders a table with columns for photo, name, specialty, email, fee, and availability status. Each row includes an availability toggle that calls POST /api/admin/change-availability and updates the row in place. Show SkeletonRow during load.
  - Files: admin/src/pages/admin/AddDoctor.jsx, admin/src/pages/admin/DoctorsList.jsx
  - Requirements: R13
  - Dependencies: 7, 22

- [x] 26. Admin Panel — Doctor Dashboard and Appointments
  - Description: Create doctor/DoctorDashboard.jsx that fetches GET /api/doctor/dashboard with the dtoken header and renders an earnings card, stat cards (total appointments, completed, pending), and a table of the 5 most recent appointments. Show SkeletonRow while loading. Create doctor/DoctorAppointments.jsx that fetches GET /api/doctor/appointments and renders a full appointment list showing patient photo, name, date, time slot, fee, and status. Add a "Complete" button for pending appointments (calls POST /api/doctor/complete-appointment) and a "Cancel" button (opens ConfirmDialog, then calls POST /api/doctor/cancel-appointment). Refresh the list after each action and show a success toast. Show SkeletonRow during load and empty state when no appointments exist.
  - Files: admin/src/pages/doctor/DoctorDashboard.jsx, admin/src/pages/doctor/DoctorAppointments.jsx
  - Requirements: R10, R11
  - Dependencies: 10, 22

- [x] 27. Admin Panel — Doctor Profile
  - Description: Create doctor/DoctorProfile.jsx that fetches GET /api/doctor/profile with the dtoken header and displays the doctor current fee, address, availability status, and bio in a read-only view. Provide an "Edit" button that switches to an editable form. Validate fee > 0 and <= 99999.99, bio <= 500 characters, and address lines <= 200 characters total. Show inline field-level validation errors. On submit POST to /api/doctor/update-profile with the dtoken header. On success show a success toast, refresh the profile display, and exit edit mode.
  - Files: admin/src/pages/doctor/DoctorProfile.jsx
  - Requirements: R12
  - Dependencies: 9, 22

- [x] 28. Admin Panel — Route Wiring and Guards
  - Description: Update admin/src/main.jsx to define all routes: /login (Login), /admin-dashboard (Dashboard), /all-appointments (AllAppointments), /add-doctor (AddDoctor), /doctor-list (DoctorsList), /doctor-dashboard (DoctorDashboard), /doctor-appointments (DoctorAppointments), /doctor-profile (DoctorProfile). Implement route guards: if neither adminToken nor dToken is present in context, redirect to /login. If adminToken is set, redirect doctor-only routes to /admin-dashboard. If dToken is set, redirect admin-only routes to /doctor-dashboard.
  - Files: admin/src/main.jsx
  - Requirements: R16
  - Dependencies: 23, 24, 25, 26, 27

### Phase 6: Integration & Polish

- [x] 29. End-to-End Integration Testing
  - Description: With all services running (backend on port 4000, frontend on port 5173, admin on port 5174), manually verify every API connection from both frontends. Test the complete patient booking flow: register a new patient, browse and filter doctors, navigate to doctor detail, select a date and slot, confirm booking, pay via Razorpay test credentials, verify "Paid" badge appears on My Appointments. Test the doctor flow: log in as a doctor, view the booked appointment, mark it complete, verify "Completed" badge on patient side. Test the admin flow: log in as admin, add a new doctor, view all appointments, cancel a pending appointment, verify slot is released. Fix any integration issues discovered in the process.
  - Files: Any files requiring fixes identified during testing
  - Requirements: R1, R2, R3, R7, R8, R9, R10, R13, R14
  - Dependencies: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28

- [x] 30. Responsive Design Polish and Accessibility
  - Description: Audit all pages in both frontend apps at breakpoints 320px, 375px, 768px, 1024px, 1280px, and 2560px. Fix any horizontal overflow, element overlap, or loss of interactive functionality. Verify all interactive elements (buttons, links, inputs, toggles) have a visible focus:ring style for keyboard navigation. Verify all form inputs have an associated label element with a matching htmlFor/id pair. Verify all img elements have descriptive alt text for non-decorative images or alt="" for decorative ones. Confirm all CSS transitions on interactive elements use duration-300 or less. Ensure ConfirmDialog and any modal overlay traps focus while open and restores focus on close.
  - Files: Any CSS or component files requiring fixes identified during the audit
  - Requirements: R18
  - Dependencies: 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28


## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 3],
      "description": "Project scaffolding — all three apps can be initialized in parallel"
    },
    {
      "wave": 2,
      "tasks": [4, 5, 6],
      "description": "Backend models and middleware — all depend only on Task 1, can run in parallel"
    },
    {
      "wave": 3,
      "tasks": [7, 9],
      "description": "Admin and Doctor controllers — both depend on Tasks 4, 5, 6; can run in parallel"
    },
    {
      "wave": 4,
      "tasks": [8, 10, 11],
      "description": "Admin appointments/dashboard, Doctor appointment management, User auth/profile — sequential on wave 3 outputs; 8 depends on 7, 10 on 9, 11 on 4/5/6"
    },
    {
      "wave": 5,
      "tasks": [12],
      "description": "User appointment booking depends on Task 11"
    },
    {
      "wave": 6,
      "tasks": [13],
      "description": "Razorpay payment depends on Task 12"
    },
    {
      "wave": 7,
      "tasks": [14, 22],
      "description": "Frontend app shells — patient portal depends on Tasks 2 and 9; admin panel depends on Task 3"
    },
    {
      "wave": 8,
      "tasks": [15, 18, 21, 23],
      "description": "Home page, login page, about/contact, and admin login all depend on their respective app shells"
    },
    {
      "wave": 9,
      "tasks": [16, 17, 20, 24, 25],
      "description": "Doctor listing/filter, appointment page, profile page, admin dashboard/appointments, doctor management"
    },
    {
      "wave": 10,
      "tasks": [19, 26, 27],
      "description": "My Appointments page (depends on 13, 14, 17), doctor dashboard/appointments (depends on 10, 22), doctor profile (depends on 9, 22)"
    },
    {
      "wave": 11,
      "tasks": [28],
      "description": "Admin route wiring depends on all admin panel pages (Tasks 23-27)"
    },
    {
      "wave": 12,
      "tasks": [29],
      "description": "End-to-end integration testing depends on all prior tasks"
    },
    {
      "wave": 13,
      "tasks": [30],
      "description": "Responsive polish and accessibility depends on all frontend tasks"
    }
  ]
}
```

## Notes

- **Backend first:** Implement and smoke-test all backend endpoints (Tasks 1-13) before starting frontend work. Use a tool like Postman or Thunder Client to verify each route independently.
- **Environment variables:** Copy `.env.example` to `.env` in each app and fill in real credentials (MongoDB URI, JWT secret, Cloudinary keys, Razorpay keys, admin email/password) before running any service.
- **Ports:** Backend runs on 4000, frontend on 5173, admin on 5174. Set `VITE_BACKEND_URL=http://localhost:4000` in both frontend `.env` files during development.
- **Razorpay testing:** Use Razorpay test mode keys and test card numbers during development. Never commit real keys to source control.
- **Slot atomicity:** The `bookAppointment` handler (Task 12) uses a MongoDB `$set` operation to mark slots. This is not a true transaction. For strict double-booking prevention in production, upgrade to a MongoDB session-based transaction.
- **Rate limiting (Task 9):** The in-memory rate limiter is suitable for a single Node.js instance. For multi-instance or production deployments, replace it with a Redis-backed solution such as `rate-limiter-flexible`.
- **Image uploads:** Multer uses `memoryStorage` — images are held in RAM, not written to disk. Ensure the server has sufficient memory for concurrent upload requests. The 5 MB per-file limit is enforced before the buffer reaches Cloudinary.
- **Admin credentials:** Admin email and password are stored exclusively in backend environment variables (not in the database). The admin login endpoint compares submitted credentials against `process.env.ADMIN_EMAIL` and `process.env.ADMIN_PASSWORD` directly.
- **Token headers:** Patient requests use the `token` header, doctor requests use `dtoken`, and admin requests use `atoken`. All frontends must send the correct header name for their portal.


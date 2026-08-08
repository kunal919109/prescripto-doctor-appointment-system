# Design Document — Prescripto Doctor Appointment Booking System

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Database Schema](#2-database-schema)
3. [API Endpoints](#3-api-endpoints)
4. [Authentication & Middleware Design](#4-authentication--middleware-design)
5. [Slot Generation Algorithm](#5-slot-generation-algorithm)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Image Upload Flow](#7-image-upload-flow)
8. [Payment Flow (Razorpay)](#8-payment-flow-razorpay)
9. [Modern UI Design System](#9-modern-ui-design-system)
10. [Environment Variables](#10-environment-variables)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Requirement Traceability](#12-requirement-traceability)

---

## 1. System Architecture

### 1.1 High-Level ASCII Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT TIER                                │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Patient Portal  │  │   Admin Panel    │  │ Doctor Dashboard │  │
│  │  React + Vite    │  │  React + Vite    │  │  (same admin app │  │
│  │  Tailwind CSS    │  │  Tailwind CSS    │  │   role-routed)   │  │
│  │  port: 5173      │  │  port: 5174      │  │                  │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
└───────────┼────────────────────┼─────────────────────┼─────────────┘
            │   HTTPS/REST       │   HTTPS/REST        │  HTTPS/REST
            └────────────────────┼─────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     EXPRESS API SERVER   │
                    │   Node.js + Express.js   │
                    │       port: 4000         │
                    │                         │
                    │  /api/user   (authUser)  │
                    │  /api/doctor (authDoctor)│
                    │  /api/admin  (authAdmin) │
                    └──┬──────────┬───────────┘
                       │          │
           ┌───────────▼──┐  ┌────▼──────────────┐
           │   MongoDB    │  │  External Services │
           │  (Mongoose)  │  │                   │
           │              │  │  ┌─────────────┐  │
           │  - users     │  │  │  Cloudinary │  │
           │  - doctors   │  │  │ (image CDN) │  │
           │  - appoints  │  │  └─────────────┘  │
           └──────────────┘  │  ┌─────────────┐  │
                             │  │  Razorpay   │  │
                             │  │ (payments)  │  │
                             │  └─────────────┘  │
                             └───────────────────┘
```

### 1.2 Monorepo Folder Structure

```
/                                      ← repository root
├── backend/                           ← Express API server
│   ├── config/
│   │   └── mongodb.js                 ← Mongoose connection setup
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── doctorController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authUser.js
│   │   ├── authDoctor.js
│   │   ├── authAdmin.js
│   │   └── multer.js                  ← Multer memoryStorage config
│   ├── models/
│   │   ├── userModel.js
│   │   ├── doctorModel.js
│   │   └── appointmentModel.js
│   ├── routes/
│   │   ├── userRoute.js
│   │   ├── doctorRoute.js
│   │   └── adminRoute.js
│   ├── utils/
│   │   └── cloudinary.js              ← Cloudinary config + upload helper
│   ├── .env
│   ├── package.json
│   └── server.js                      ← Express app entry point
│
├── frontend/                          ← Patient Portal (React + Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── main.jsx
│   ├── .env
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── admin/                             ← Admin + Doctor Panel (React + Vite)
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   └── main.jsx
    ├── .env
    ├── index.html
    ├── tailwind.config.js
    └── vite.config.js
```

### 1.3 Request Flow Summary

Every API request follows this path:

```
Client Request
  → Express Router (matches /api/<resource>/<action>)
    → Auth Middleware (verifies JWT, attaches identity to req)
      → Multer Middleware (only on upload endpoints)
        → Controller Function (business logic)
          → Mongoose Model (database operation)
          → Cloudinary / Razorpay (external services, when needed)
        → JSON Response { success, message, data? }
```

---

## 2. Database Schema

### 2.1 User (Patient) Model — `userModel.js`

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true          // stored as bcrypt hash, never plain-text
  },
  image: {
    type: String,
    default: 'https://res.cloudinary.com/<cloud>/image/upload/default_profile.png'
  },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Not Selected'],
    default: 'Not Selected'
  },
  dob: {
    type: String,           // stored as "YYYY-MM-DD" string
    default: 'Not Selected'
  },
  phone: {
    type: String,
    default: '0000000000'
  }
}, { timestamps: true });

export default mongoose.model('user', userSchema);
```

### 2.2 Doctor Model — `doctorModel.js`

```js
import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true          // bcrypt hash, salt rounds = 10
  },
  image: {
    type: String,
    required: true          // Cloudinary secure_url
  },
  speciality: {
    type: String,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  experience: {
    type: String,           // e.g. "5 Years"
    default: '1 Year'
  },
  about: {
    type: String,
    maxlength: 500,
    default: ''
  },
  available: {
    type: Boolean,
    default: true
  },
  fees: {
    type: Number,
    required: true,
    min: 0.01
  },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  slots_booked: {
    type: Object,           // { "12_07_2025": ["9:00 AM", "9:30 AM"], ... }
    default: {}
  },
  date: {
    type: Number,           // Date.now() timestamp at account creation
    default: () => Date.now()
  }
}, { minimize: false });    // preserve empty objects in slots_booked

export default mongoose.model('doctor', doctorSchema);
```

**Note on `slots_booked`:** Using a plain `Object` (not `Map`) because MongoDB stores it as a sub-document keyed by date string. The `minimize: false` option prevents Mongoose from stripping empty objects when all slots for a day are freed.

### 2.3 Appointment Model — `appointmentModel.js`

```js
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: true
  },
  slotDate: {
    type: String,
    required: true          // format: "DD_MM_YYYY"  e.g. "12_07_2025"
  },
  slotTime: {
    type: String,
    required: true          // 12-hour format  e.g. "10:00 AM"
  },
  userData: {
    type: Object,           // snapshot of user at booking time
    required: true
  },
  docData: {
    type: Object,           // snapshot of doctor at booking time
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Number,           // Date.now() booking timestamp
    default: () => Date.now()
  },
  cancelled: {
    type: Boolean,
    default: false
  },
  payment: {
    type: Boolean,
    default: false          // true once Razorpay signature verified
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('appointment', appointmentSchema);
```

**Data snapshot rationale:** `userData` and `docData` capture the patient and doctor state at booking time. This ensures historical appointment records remain accurate even if the user later changes their name, photo, or fee.

### 2.4 Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
│    users     │         │   appointments   │         │   doctors    │
│──────────────│         │──────────────────│         │──────────────│
│ _id (ObjId)  │◄────────│ userId (ObjId)   │─────────►│ _id (ObjId)  │
│ name         │  1      │ docId  (ObjId)   │      1  │ name         │
│ email        │  :      │ slotDate         │      :  │ email        │
│ password     │  N      │ slotTime         │      N  │ password     │
│ image        │         │ userData (snap)  │         │ speciality   │
│ address      │         │ docData  (snap)  │         │ degree       │
│ gender       │         │ amount           │         │ experience   │
│ dob          │         │ date             │         │ about        │
│ phone        │         │ cancelled        │         │ available    │
└──────────────┘         │ payment          │         │ fees         │
                         │ isCompleted      │         │ address      │
                         └──────────────────┘         │ slots_booked │
                                                       │ date         │
                                                       └──────────────┘
```

---

## 3. API Endpoints

All responses follow a consistent envelope:

```json
{ "success": true,  "message": "...", "data": { ... } }
{ "success": false, "message": "...", "data": null }
```

### 3.1 User Routes — `POST|GET /api/user`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Patient registration |
| POST | `/login` | None | Patient login |
| GET | `/get-profile` | `authUser` | Get patient profile |
| POST | `/update-profile` | `authUser` + Multer | Update profile + optional image |
| GET | `/appointments` | `authUser` | List patient's appointments |
| POST | `/book-appointment` | `authUser` | Book an appointment |
| POST | `/cancel-appointment` | `authUser` | Cancel a patient appointment |
| POST | `/payment-razorpay` | `authUser` | Create Razorpay order |
| POST | `/verifyRazorpay` | `authUser` | Verify Razorpay payment signature |

**POST `/api/user/register`**
```
Request:  { name, email, password }
Response: { success, message, token }
Errors:   400 (missing fields, weak password, name too long)
          400 (email already exists)
```

**POST `/api/user/login`**
```
Request:  { email, password }
Response: { success, message, token }
Errors:   401 (invalid credentials)
```

**GET `/api/user/get-profile`**
```
Headers:  Authorization: Bearer <token>  (or token in header "token")
Response: { success, userData: { _id, name, email, image, address, gender, dob, phone } }
```

**POST `/api/user/update-profile`**
```
Headers:  token
Body:     multipart/form-data { name, phone, address (JSON string), dob, gender, image? }
Response: { success, message }
Errors:   400 (validation failures), 400 (file too large / wrong format)
```

**POST `/api/user/book-appointment`**
```
Headers:  token
Body:     { docId, slotDate, slotTime }
Response: { success, message }
Errors:   400 (doctor unavailable), 409 (slot already taken), 409 (duplicate booking)
```

**POST `/api/user/cancel-appointment`**
```
Headers:  token
Body:     { appointmentId }
Response: { success, message }
Errors:   400 (already cancelled/completed), 403 (not owner)
```

**POST `/api/user/payment-razorpay`**
```
Headers:  token
Body:     { appointmentId }
Response: { success, order: { id, amount, currency } }
Errors:   400 (already paid or cancelled), 502 (Razorpay API failure)
```

**POST `/api/user/verifyRazorpay`**
```
Headers:  token
Body:     { razorpay_order_id, razorpay_payment_id, razorpay_signature }
Response: { success, message }
Errors:   400 (signature mismatch)
```

### 3.2 Doctor Routes — `POST|GET /api/doctor`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/list` | None | Public — list available doctors |
| POST | `/login` | None | Doctor login |
| GET | `/appointments` | `authDoctor` | Doctor's own appointments |
| POST | `/complete-appointment` | `authDoctor` | Mark appointment complete |
| POST | `/cancel-appointment` | `authDoctor` | Cancel appointment |
| GET | `/dashboard` | `authDoctor` | Earnings + stats |
| GET | `/profile` | `authDoctor` | Get doctor profile |
| POST | `/update-profile` | `authDoctor` | Update doctor profile |

**GET `/api/doctor/list`**
```
Response: { success, doctors: [ { _id, name, speciality, image, fees, available, ... } ] }
Note:     Returns only `available: true` doctors. Password field excluded.
```

**POST `/api/doctor/login`**
```
Request:  { email, password }
Response: { success, token }
Errors:   401 (invalid credentials), 429 (rate limited after 5 failures in 15 min)
```

**GET `/api/doctor/dashboard`**
```
Headers:  dtoken
Response: {
  success,
  dashData: {
    earnings,       // sum of fees for isCompleted appointments
    appointments,   // total count
    patients,       // distinct patient count
    latestAppointments: [ ...5 most recent ]
  }
}
```

**POST `/api/doctor/complete-appointment`**
```
Headers:  dtoken
Body:     { appointmentId }
Response: { success, message }
Errors:   400 (not pending), 403 (not assigned to this doctor)
```

**POST `/api/doctor/update-profile`**
```
Headers:  dtoken
Body:     { fees, address (JSON), available, about }
Response: { success, message }
Errors:   400 (fee <= 0), 400 (bio > 500 chars, address > 200 chars)
```

### 3.3 Admin Routes — `POST|GET /api/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | None | Admin login |
| POST | `/add-doctor` | `authAdmin` + Multer | Add new doctor with image |
| GET | `/all-doctors` | `authAdmin` | List all doctors (no pagination) |
| POST | `/change-availability` | `authAdmin` | Toggle doctor availability |
| GET | `/appointments` | `authAdmin` | All system appointments |
| POST | `/cancel-appointment` | `authAdmin` | Cancel any appointment |
| GET | `/dashboard` | `authAdmin` | Platform-wide stats |

**POST `/api/admin/login`**
```
Request:  { email, password }
Response: { success, token }
Note:     Admin credentials stored in env vars, not DB.
Errors:   401 (invalid), 400 (missing fields)
```

**POST `/api/admin/add-doctor`**
```
Headers:  atoken
Body:     multipart/form-data {
            name, email, password, speciality, degree,
            experience, about, fees, address (JSON), image
          }
Response: { success, message }
Errors:   400 (email exists), 400 (missing required fields)
```

**GET `/api/admin/dashboard`**
```
Headers:  atoken
Response: {
  success,
  dashData: {
    doctors,        // total count
    patients,       // total count
    appointments,   // total count
    latestAppointments: [ ...5 most recent with patient + doctor names ]
  }
}
```

---

## 4. Authentication & Middleware Design

### 4.1 JWT Payload Structures

```js
// Patient token (issued by /api/user/register and /api/user/login)
{ id: userId, role: "patient" }

// Doctor token (issued by /api/doctor/login)
{ id: doctorId, role: "doctor" }

// Admin token (issued by /api/admin/login)
{ email: adminEmail, role: "admin" }
// Note: admin is NOT stored in DB — credentials come from process.env
```

All tokens are signed with `process.env.JWT_SECRET` and expire in **7 days**.

### 4.2 Middleware Implementations

**`authUser.js`** — protects patient endpoints

```js
import jwt from 'jsonwebtoken';

const authUser = async (req, res, next) => {
  const { token } = req.headers;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authUser;
```

**`authDoctor.js`** — protects doctor endpoints

```js
import jwt from 'jsonwebtoken';

const authDoctor = async (req, res, next) => {
  const { dtoken } = req.headers;
  if (!dtoken) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }
  try {
    const decoded = jwt.verify(dtoken, process.env.JWT_SECRET);
    if (decoded.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }
    req.docId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authDoctor;
```

**`authAdmin.js`** — protects admin endpoints

```js
import jwt from 'jsonwebtoken';

const authAdmin = async (req, res, next) => {
  const { atoken } = req.headers;
  if (!atoken) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login Again.' });
  }
  try {
    const decoded = jwt.verify(atoken, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access Denied.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

export default authAdmin;
```

### 4.3 Token Header Convention

| Portal | Header Name | Value |
|--------|-------------|-------|
| Patient Portal | `token` | `<patient JWT>` |
| Doctor Dashboard | `dtoken` | `<doctor JWT>` |
| Admin Panel | `atoken` | `<admin JWT>` |

### 4.4 Rate Limiting (Requirement R2.5)

Doctor login brute-force protection is implemented using an in-memory map (suitable for single-instance; replace with Redis for multi-instance):

```js
// In-memory store: { email: { attempts: N, windowStart: timestamp } }
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(email) {
  const now = Date.now();
  const record = loginAttempts.get(email) || { attempts: 0, windowStart: now };

  if (now - record.windowStart > WINDOW_MS) {
    // Reset window
    loginAttempts.set(email, { attempts: 1, windowStart: now });
    return { blocked: false };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return { blocked: true, retryAfter: WINDOW_MS - (now - record.windowStart) };
  }

  record.attempts++;
  loginAttempts.set(email, record);
  return { blocked: false };
}
```

---

## 5. Slot Generation Algorithm

Slots span **09:00–20:30** in 30-minute increments, producing **24 slots/day** across **7 days**.

```js
/**
 * Generate available appointment slots for a doctor.
 * @param {Object} doctor  - Mongoose doctor document
 * @param {number} days    - number of days to generate (default 7)
 * @returns {Object}       - { "DD_MM_YYYY": ["9:00 AM", "9:30 AM", ...] }
 */
function getAvailableSlots(doctor, days = 7) {
  const slots = {};
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Build date key  "DD_MM_YYYY"
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const dateKey = `${dd}_${mm}_${yyyy}`;

    const bookedSlots = doctor.slots_booked[dateKey] || [];
    const daySlots = [];

    // Iterate slots from 09:00 to 20:30
    const slotStart = new Date(date);
    slotStart.setHours(9, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(21, 0, 0, 0);   // exclusive boundary

    const now = new Date();

    while (slotStart < slotEnd) {
      const hours = slotStart.getHours();
      const minutes = slotStart.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      const formattedTime = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;

      const isPast = (i === 0) && (slotStart <= now);
      const isBooked = bookedSlots.includes(formattedTime);

      if (!isPast && !isBooked) {
        daySlots.push(formattedTime);
      }

      slotStart.setMinutes(slotStart.getMinutes() + 30);
    }

    if (daySlots.length > 0) {
      slots[dateKey] = daySlots;
    }
  }

  return slots;
}
```

**Booking slot atomicity** — when a slot is booked, the doctor document is updated using `$set`:

```js
await doctorModel.findByIdAndUpdate(docId, {
  $set: {
    [`slots_booked.${slotDate}`]: [...existingSlots, slotTime]
  }
});
```

**Cancellation slot release:**

```js
const updatedSlots = existingSlots.filter(t => t !== slotTime);
await doctorModel.findByIdAndUpdate(docId, {
  $set: { [`slots_booked.${slotDate}`]: updatedSlots }
});
```

---

## 6. Frontend Architecture

### 6.1 Patient Portal (`/frontend`)

```
frontend/src/
├── assets/
│   ├── images/           # logo, banners, specialty icons
│   └── icons/
├── components/
│   ├── Navbar.jsx         # sticky top nav, login/profile dropdown
│   ├── Footer.jsx         # links + copyright
│   ├── DoctorCard.jsx     # card used in listings (photo, name, specialty, fee)
│   ├── SpecialityMenu.jsx # horizontal scroll specialty filter buttons
│   ├── TopDoctors.jsx     # home page section, shows top 8 doctors
│   ├── Banner.jsx         # promotional CTA banner on home page
│   ├── RelatedDoctors.jsx # shown on Appointment page, same specialty
│   └── SkeletonCard.jsx   # animate-pulse placeholder for DoctorCard
├── context/
│   └── AppContext.jsx     # global state provider
├── pages/
│   ├── Home.jsx           # landing page
│   ├── Doctors.jsx        # browse + specialty filter
│   ├── Appointment.jsx    # doctor profile + slot picker + book
│   ├── MyAppointments.jsx # patient's appointments list
│   ├── MyProfile.jsx      # edit profile + photo upload
│   ├── Login.jsx          # register / login toggle
│   ├── About.jsx          # platform about page
│   └── Contact.jsx        # contact form page
└── main.jsx               # BrowserRouter + AppContextProvider root
```

**AppContext state shape:**

```js
// context/AppContext.jsx
const contextValue = {
  // Auth
  token,             // string | null  (patient JWT from localStorage)
  setToken,

  // Data
  doctors,           // Doctor[]  fetched from /api/doctor/list
  userData,          // UserProfile | null

  // Helpers
  getDoctors,        // () => void  — refetch doctor list
  getUserData,       // () => void  — refetch patient profile
  currencySymbol,    // "$"
  backendUrl,        // import.meta.env.VITE_BACKEND_URL
};
```

**Routing (`main.jsx`):**

```jsx
<Routes>
  <Route path="/"                element={<Home />} />
  <Route path="/doctors"         element={<Doctors />} />
  <Route path="/doctors/:speciality" element={<Doctors />} />
  <Route path="/appointment/:docId"  element={<Appointment />} />
  <Route path="/my-appointments" element={<MyAppointments />} />
  <Route path="/my-profile"      element={<MyProfile />} />
  <Route path="/login"           element={<Login />} />
  <Route path="/about"           element={<About />} />
  <Route path="/contact"         element={<Contact />} />
</Routes>
```

### 6.2 Admin Panel (`/admin`)

The admin app serves **both** Admin and Doctor users. On login, it detects the role from the returned JWT and persists to the appropriate context. The sidebar and routing differ based on active role.

```
admin/src/
├── assets/
│   └── images/
├── components/
│   ├── Navbar.jsx         # top bar with logout; shows active portal name
│   ├── Sidebar.jsx        # role-aware nav: admin links vs doctor links
│   └── SkeletonRow.jsx    # table row skeleton for loading states
├── context/
│   ├── AppContext.jsx     # adminToken state + axios helpers
│   └── DoctorContext.jsx  # dToken state + doctor-specific data
├── pages/
│   ├── Login.jsx          # unified login: tries admin first, then doctor
│   ├── admin/
│   │   ├── Dashboard.jsx       # stat cards + recent appointments table
│   │   ├── AllAppointments.jsx # paginated table of all appointments
│   │   ├── AddDoctor.jsx       # form to add new doctor
│   │   └── DoctorsList.jsx     # table of all doctors + availability toggle
│   └── doctor/
│       ├── DoctorDashboard.jsx    # earnings cards + recent appointments
│       ├── DoctorAppointments.jsx # doctor's own appointment list
│       └── DoctorProfile.jsx      # doctor edit profile form
└── main.jsx
```

**Role-based routing (`main.jsx`):**

```jsx
<Routes>
  <Route path="/login" element={<Login />} />

  {/* Admin routes */}
  <Route path="/admin-dashboard"   element={<Dashboard />} />
  <Route path="/all-appointments"  element={<AllAppointments />} />
  <Route path="/add-doctor"        element={<AddDoctor />} />
  <Route path="/doctor-list"       element={<DoctorsList />} />

  {/* Doctor routes */}
  <Route path="/doctor-dashboard"       element={<DoctorDashboard />} />
  <Route path="/doctor-appointments"    element={<DoctorAppointments />} />
  <Route path="/doctor-profile"         element={<DoctorProfile />} />
</Routes>
```

**Login detection logic:**

```js
// pages/Login.jsx  — on form submit
const handleLogin = async (e) => {
  e.preventDefault();
  // Attempt admin login first
  if (email === process.env.ADMIN_EMAIL) {
    const { data } = await axios.post('/api/admin/login', { email, password });
    if (data.success) {
      adminContext.setAdminToken(data.token);
      navigate('/admin-dashboard');
      return;
    }
  }
  // Fallback: doctor login
  const { data } = await axios.post('/api/doctor/login', { email, password });
  if (data.success) {
    doctorContext.setDToken(data.token);
    navigate('/doctor-dashboard');
  }
};
```

### 6.3 Axios Configuration

Both apps configure a shared Axios instance with a response interceptor:

```js
// frontend/src/lib/axiosInstance.js
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'An unexpected error occurred.';
    toast.error(msg);
    return Promise.reject(err);
  }
);

export default api;
```

---

## 7. Image Upload Flow

### 7.1 Architecture

```
Client (multipart/form-data  field: "image")
  │
  ▼
Multer Middleware  (memoryStorage — no disk write)
  │  validates: JPEG | PNG | WebP only
  │  validates: size ≤ 5 MB
  │  populates: req.file.buffer
  ▼
Controller calls uploadToCloudinary(req.file.buffer)
  │
  ▼
Cloudinary upload_stream()
  │  streams buffer
  │  returns: { secure_url, public_id, ... }
  ▼
Controller saves secure_url → MongoDB document
  │
  ▼
JSON response { success: true, message: "..." }
```

### 7.2 Multer Configuration — `middleware/multer.js`

```js
import multer from 'multer';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported image format'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
```

### 7.3 Cloudinary Upload Helper — `utils/cloudinary.js`

```js
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer
 * @param {Object} options  - cloudinary upload options (folder, etc.)
 * @returns {Promise<Object>}  - Cloudinary result with secure_url
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'prescripto', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

export default cloudinary;
```

### 7.4 Error Cases

| Scenario | HTTP Status | Response Message |
|----------|-------------|-----------------|
| File missing entirely | 400 | "Image file is required" |
| Unsupported format | 400 | "Unsupported image format" |
| File exceeds 5 MB | 400 | "Image size must not exceed 5 MB" |
| Cloudinary upload fails | 500 | "Image could not be uploaded" |
| Cloudinary success but DB write fails | 500 | "Profile could not be saved" |

---

## 8. Payment Flow (Razorpay)

### 8.1 Sequence Diagram

```
Patient_Portal          Backend (Payment_Service)       Razorpay API
     │                           │                           │
     │ POST /payment-razorpay    │                           │
     │ { appointmentId }         │                           │
     │──────────────────────────►│                           │
     │                           │ razorpay.orders.create()  │
     │                           │──────────────────────────►│
     │                           │   { id, amount, currency }│
     │                           │◄──────────────────────────│
     │ { orderId, amount }       │                           │
     │◄──────────────────────────│                           │
     │                           │                           │
     │ (open Razorpay checkout modal)                        │
     │                           │                           │
     │ (user completes payment)  │                           │
     │    handler called with:   │                           │
     │ { payment_id, order_id,   │                           │
     │   signature }             │                           │
     │                           │                           │
     │ POST /verifyRazorpay       │                           │
     │ { payment_id, order_id,   │                           │
     │   signature }             │                           │
     │──────────────────────────►│                           │
     │                           │ HMAC-SHA256 verify        │
     │                           │ (orderId|paymentId, secret)
     │                           │                           │
     │ { success: true }         │                           │
     │◄──────────────────────────│                           │
     │ (show "Paid" badge)       │                           │
```

### 8.2 Backend Implementation

```js
// controllers/userController.js  — paymentRazorpay()
import Razorpay from 'razorpay';

const razorpayInstance = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const paymentRazorpay = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment || appointment.cancelled) {
      return res.status(400).json({ success: false, message: 'Appointment not found or cancelled' });
    }
    if (appointment.payment) {
      return res.status(400).json({ success: false, message: 'Appointment already paid' });
    }

    const order = await razorpayInstance.orders.create({
      amount:   appointment.amount * 100, // paise
      currency: 'INR',
      receipt:  appointmentId,
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Payment service temporarily unavailable' });
  }
};
```

```js
// controllers/userController.js  — verifyRazorpay()
import crypto from 'crypto';

export const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Fetch order to get receipt = appointmentId
    const order = await razorpayInstance.orders.fetch(razorpay_order_id);
    await appointmentModel.findByIdAndUpdate(order.receipt, { payment: true });

    res.json({ success: true, message: 'Payment successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
```

### 8.3 Frontend Checkout Integration

```js
// Appointment.jsx / MyAppointments.jsx
const initRazorpayPayment = (order) => {
  const options = {
    key:      import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount:   order.amount,
    currency: order.currency,
    name:     'Prescripto',
    description: 'Appointment Consultation Fee',
    order_id: order.id,
    handler: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
      const { data } = await axios.post(
        '/api/user/verifyRazorpay',
        { razorpay_payment_id, razorpay_order_id, razorpay_signature },
        { headers: { token } }
      );
      if (data.success) toast.success('Payment successful!');
      getUserAppointments(); // refresh list
    },
    prefill: { name: userData.name, email: userData.email },
    theme:   { color: '#5F6FFF' },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

---

## 9. Modern UI Design System

### 9.1 Color Palette

```js
// tailwind.config.js  (shared across frontend/ and admin/)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:        '#5F6FFF',   // vibrant indigo-blue
        'primary-dark': '#4A57E8',
        secondary:      '#F0F4FF',   // soft blue tint background
        accent:         '#00C8A0',   // teal — success / confirmed states
        'text-primary': '#1A1A2E',
        'text-secondary':'#6B7280',
        border:         '#E5E7EB',
        error:          '#EF4444',
        warning:        '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
};
```

**CSS custom properties (for non-Tailwind usage):**

```css
/* index.css */
:root {
  --color-primary:         #5F6FFF;
  --color-primary-dark:    #4A57E8;
  --color-secondary:       #F0F4FF;
  --color-accent:          #00C8A0;
  --color-text-primary:    #1A1A2E;
  --color-text-secondary:  #6B7280;
  --color-border:          #E5E7EB;
  --color-error:           #EF4444;
  --color-warning:         #F59E0B;
}
```

### 9.2 Typography

| Element | Tailwind Classes |
|---------|-----------------|
| Page heading (h1) | `text-3xl font-bold text-text-primary` |
| Section heading (h2) | `text-2xl font-semibold text-text-primary` |
| Card title | `text-lg font-semibold text-text-primary` |
| Body text | `text-sm font-normal text-text-secondary` |
| Label | `text-xs font-medium text-text-secondary uppercase tracking-wide` |
| Link | `text-primary hover:text-primary-dark underline-offset-2` |

Font loaded via `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### 9.3 Component Design Tokens

**Cards:**
```
rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 bg-white border border-border
```

**Primary CTA Button:**
```
bg-primary hover:bg-primary-dark text-white font-semibold rounded-full px-6 py-2.5
transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
```

**Secondary Button:**
```
border border-primary text-primary hover:bg-secondary rounded-lg px-5 py-2
transition-colors duration-200
```

**Danger Button (cancel):**
```
border border-error text-error hover:bg-red-50 rounded-lg px-5 py-2
transition-colors duration-200
```

**Text Input:**
```
w-full rounded-xl border border-border px-4 py-2.5 text-sm text-text-primary
focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
placeholder:text-text-secondary transition-shadow duration-200
```

**Navigation Bar:**
```
sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border
shadow-sm px-6 py-4 flex items-center justify-between
```

**Badge variants:**
```
// Completed
bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full

// Cancelled
bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-0.5 rounded-full

// Pending
bg-yellow-100 text-yellow-700 text-xs font-semibold px-2.5 py-0.5 rounded-full

// Paid
bg-accent/10 text-accent text-xs font-semibold px-2.5 py-0.5 rounded-full
```

**Skeleton Loading:**
```
animate-pulse bg-gray-200 rounded-2xl  // for card skeletons
animate-pulse bg-gray-200 rounded      // for text line skeletons
animate-pulse bg-gray-200 rounded-full // for circular avatar skeletons
```

### 9.4 Responsive Grid — Doctor Listing

```jsx
// Doctors.jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {doctors.map(doc => <DoctorCard key={doc._id} doctor={doc} />)}
</div>
```

Breakpoints:
- `< 640px` (xs/mobile): 1 column
- `640px–1023px` (sm/tablet): 2 columns
- `≥ 1024px` (lg/desktop): 3 columns
- `≥ 1280px` (xl): 4 columns

### 9.5 Confirmation Dialog (Destructive Actions)

Per R18.9, cancellation actions must show a confirmation dialog:

```jsx
// components/ConfirmDialog.jsx
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel }) => (
  open ? (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="...secondary button classes...">
            Keep Appointment
          </button>
          <button onClick={onConfirm} className="...danger button classes...">
            Cancel Appointment
          </button>
        </div>
      </div>
    </div>
  ) : null
);
```

---

## 10. Environment Variables

### 10.1 Backend — `backend/.env`

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/prescripto

# Auth
JWT_SECRET=<long-random-secret-min-32-chars>

# Admin credentials (not stored in DB)
ADMIN_EMAIL=admin@prescripto.com
ADMIN_PASSWORD=<secure-admin-password>

# Cloudinary
CLOUDINARY_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_SECRET_KEY=<api-secret>

# Razorpay
RAZORPAY_KEY_ID=rzp_test_<key-id>
RAZORPAY_KEY_SECRET=<key-secret>

# Server
PORT=4000
```

### 10.2 Patient Portal — `frontend/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
VITE_RAZORPAY_KEY_ID=rzp_test_<key-id>
```

### 10.3 Admin Panel — `admin/.env`

```env
VITE_BACKEND_URL=http://localhost:4000
```

### 10.4 Security Notes

- The `RAZORPAY_KEY_SECRET` is **backend-only** — it MUST NOT appear in any frontend `.env` file or be included in API responses (R9.6, R9.7).
- The `JWT_SECRET` is backend-only. All signing and verification happens on the server.
- `.env` files are `.gitignore`d. Provide `.env.example` files with placeholder values in each package.
- In production, inject environment variables via the hosting platform's secret management (not committed `.env` files).

---

## 11. Error Handling Strategy

### 11.1 Backend — Controller Pattern

Every controller is wrapped in try/catch. The response shape is always consistent:

```js
// Successful response
res.status(200).json({ success: true, message: 'Profile updated', data: updatedUser });

// Error response
res.status(400).json({ success: false, message: 'Email already registered' });
```

Global error handler in `server.js` catches unhandled middleware errors:

```js
// server.js  — after all routes
app.use((err, req, res, next) => {
  if (err.message === 'Unsupported image format') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image size must not exceed 5 MB' });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});
```

### 11.2 HTTP Status Code Reference

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful read/update operations |
| 201 | Created | (optional, may use 200 for simplicity) Registration success |
| 400 | Bad Request | Validation failure, business rule violation, wrong state |
| 401 | Unauthorized | Missing/invalid/expired JWT |
| 403 | Forbidden | Valid JWT but wrong role, or accessing another user's resource |
| 409 | Conflict | Slot already booked, duplicate booking, email already registered |
| 429 | Too Many Requests | Rate limit exceeded (doctor login brute-force) |
| 500 | Internal Server Error | Unhandled exceptions, DB errors |
| 502 | Bad Gateway | External service failure (Razorpay, Cloudinary) |

### 11.3 Frontend — Error Display

```js
// All API errors displayed via react-toastify toast.error()
// No raw stack traces or error objects exposed to users

// Example in MyAppointments.jsx
const cancelAppointment = async (id) => {
  try {
    const { data } = await axios.post('/api/user/cancel-appointment',
      { appointmentId: id },
      { headers: { token } }
    );
    if (data.success) {
      toast.success('Appointment cancelled');
      getAppointments();
    } else {
      toast.error(data.message);
    }
  } catch (err) {
    toast.error(err.response?.data?.message || 'Something went wrong');
  }
};
```

### 11.4 Loading & Empty States

| State | UI Treatment |
|-------|-------------|
| Data fetching | Skeleton components (animate-pulse) |
| Empty list | Descriptive empty state message |
| API error | Toast notification + retry button where appropriate |
| No doctors found | "No doctors found for this specialty." |
| No appointments | "You have no appointments yet." |
| Doctor unavailable | "No slots currently available." |

---

## 12. Requirement Traceability

| Requirement | Description | Backend Files | Frontend Files |
|-------------|-------------|---------------|----------------|
| **R1** | Patient Registration & Login | `controllers/userController.js` (`registerUser`, `loginUser`), `routes/userRoute.js`, `models/userModel.js`, `middleware/authUser.js` | `frontend/src/pages/Login.jsx`, `frontend/src/context/AppContext.jsx` |
| **R2** | Doctor Login | `controllers/doctorController.js` (`loginDoctor`), `routes/doctorRoute.js`, `middleware/authDoctor.js` | `admin/src/pages/Login.jsx`, `admin/src/context/DoctorContext.jsx` |
| **R3** | Admin Login | `controllers/adminController.js` (`adminLogin`), `routes/adminRoute.js`, `middleware/authAdmin.js` | `admin/src/pages/Login.jsx`, `admin/src/context/AppContext.jsx` |
| **R4** | Patient Profile Management | `controllers/userController.js` (`getProfile`, `updateProfile`), `middleware/multer.js`, `utils/cloudinary.js` | `frontend/src/pages/MyProfile.jsx` |
| **R5** | Doctor Listing & Specialty Filter | `controllers/doctorController.js` (`doctorList`), `routes/doctorRoute.js` | `frontend/src/pages/Doctors.jsx`, `frontend/src/components/DoctorCard.jsx`, `frontend/src/components/SpecialityMenu.jsx`, `frontend/src/components/SkeletonCard.jsx` |
| **R6** | Doctor Detail & Slot Selection | `controllers/userController.js` (slot generation logic), `models/doctorModel.js` (slots_booked) | `frontend/src/pages/Appointment.jsx`, `frontend/src/components/RelatedDoctors.jsx` |
| **R7** | Appointment Booking | `controllers/userController.js` (`bookAppointment`), `models/appointmentModel.js`, `models/doctorModel.js` (slot update) | `frontend/src/pages/Appointment.jsx` |
| **R8** | Patient Appointment Management | `controllers/userController.js` (`listAppointment`, `cancelAppointment`) | `frontend/src/pages/MyAppointments.jsx` |
| **R9** | Online Payment via Razorpay | `controllers/userController.js` (`paymentRazorpay`, `verifyRazorpay`), `utils/razorpay.js` | `frontend/src/pages/MyAppointments.jsx` (Pay Now + Razorpay modal) |
| **R10** | Doctor Appointment Management | `controllers/doctorController.js` (`appointmentsDoctor`, `appointmentComplete`, `appointmentCancel`) | `admin/src/pages/doctor/DoctorAppointments.jsx` |
| **R11** | Doctor Earnings & Stats | `controllers/doctorController.js` (`doctorDashboard`) | `admin/src/pages/doctor/DoctorDashboard.jsx` |
| **R12** | Doctor Profile Management | `controllers/doctorController.js` (`doctorProfile`, `updateDoctorProfile`) | `admin/src/pages/doctor/DoctorProfile.jsx` |
| **R13** | Admin — Doctor Management | `controllers/adminController.js` (`addDoctor`, `allDoctors`, `changeAvailability`), `middleware/multer.js`, `utils/cloudinary.js` | `admin/src/pages/admin/AddDoctor.jsx`, `admin/src/pages/admin/DoctorsList.jsx` |
| **R14** | Admin — Appointment Management | `controllers/adminController.js` (`appointmentsAdmin`, `appointmentCancel`) | `admin/src/pages/admin/AllAppointments.jsx` |
| **R15** | Admin — Dashboard Statistics | `controllers/adminController.js` (`adminDashboard`) | `admin/src/pages/admin/Dashboard.jsx` |
| **R16** | Role-Based Access Control | `middleware/authUser.js`, `middleware/authDoctor.js`, `middleware/authAdmin.js`, JWT payload design | All protected pages check token presence; redirect to `/login` if absent |
| **R17** | Image Upload | `middleware/multer.js`, `utils/cloudinary.js`, `controllers/userController.js` (`updateProfile`), `controllers/adminController.js` (`addDoctor`) | `frontend/src/pages/MyProfile.jsx`, `admin/src/pages/admin/AddDoctor.jsx` |
| **R18** | Responsive & Modern UI | `frontend/tailwind.config.js`, `admin/tailwind.config.js` | All page and component files; `components/SkeletonCard.jsx`, `components/SkeletonRow.jsx`, `components/ConfirmDialog.jsx` |

---

## Appendix A — `server.js` Entry Point Structure

```js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './config/mongodb.js';
import userRouter from './routes/userRoute.js';
import doctorRouter from './routes/doctorRoute.js';
import adminRouter from './routes/adminRoute.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/user',   userRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/admin',  adminRouter);

// Health check
app.get('/', (req, res) => res.send('Prescripto API is running'));

// Global error handler (must be last)
app.use((err, req, res, next) => {
  if (err.message === 'Unsupported image format') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image size must not exceed 5 MB' });
  }
  console.error('[Unhandled Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

---

## Appendix B — Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Three separate React apps** | Clean separation of concerns; admin/doctor panel shares one build since both require login and have similar layouts |
| **Separate JWT per role** | Prevents token reuse across portals; role claim checked in middleware without DB lookup per request |
| **Admin stored in env, not DB** | Single admin account; avoids a dedicated admin collection and admin registration endpoint |
| **slots_booked as plain Object** | Simple key-value access by date string; avoids Map serialisation issues in Mongoose; `minimize: false` preserves empty days |
| **Appointment data snapshots** | Historical records remain accurate independent of profile edits; avoids joins on read |
| **Multer memoryStorage** | Avoids disk writes on server; buffer piped directly to Cloudinary upload_stream |
| **react-toastify for errors** | Consistent, non-intrusive error display across all portals; configured once in App root |
| **Context API (no Redux)** | App state is shallow (token + user data + doctors list); Redux overhead is unwarranted for this scale |
| **slotDate format `DD_MM_YYYY`** | URL-safe, human-readable, avoids timezone parsing issues with ISO strings |
| **7-day slot window** | Balances usability with slot-data volume stored in MongoDB; configurable via `days` parameter |

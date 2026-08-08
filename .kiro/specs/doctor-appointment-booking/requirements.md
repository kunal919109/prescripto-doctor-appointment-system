# Requirements Document

## Introduction

This document defines the requirements for **Prescripto** — a full-stack Doctor Appointment Booking System built on the MERN stack (MongoDB, Express.js, React.js, Node.js). The system provides three distinct portals: a Patient Portal for browsing doctors and booking appointments, a Doctor Dashboard for managing schedules and earnings, and an Admin Panel for system-wide management. All portals feature a modern, responsive UI redesigned from the original Prescripto tutorial project.

---

## Glossary

- **Patient**: A registered end-user who books appointments with doctors.
- **Doctor**: A medical professional registered in the system who accepts and manages appointments.
- **Admin**: A privileged system operator who manages doctors, appointments, and platform data.
- **Appointment**: A scheduled meeting between a Patient and a Doctor at a specific date and time slot.
- **Slot**: A discrete 30-minute time interval within a Doctor's available schedule for a given date.
- **Specialty**: A medical field category (e.g., Cardiology, Dermatology) used to classify Doctors.
- **JWT**: JSON Web Token — a signed token issued upon successful authentication, used to authorize subsequent requests.
- **System**: The Prescripto backend API server (Node.js + Express.js).
- **Patient_Portal**: The React.js frontend application used by Patients.
- **Doctor_Dashboard**: The React.js frontend application used by Doctors.
- **Admin_Panel**: The React.js frontend application used by Admins.
- **Auth_Service**: The backend module responsible for authentication and token issuance.
- **Appointment_Service**: The backend module responsible for appointment creation, retrieval, and status updates.
- **Doctor_Service**: The backend module responsible for doctor profile management.
- **Payment_Service**: The backend module responsible for payment initiation and verification via Razorpay.
- **Upload_Service**: The backend module responsible for image uploads via Cloudinary and Multer.
- **Razorpay**: The third-party payment gateway used for online appointment fee collection.
- **Cloudinary**: The third-party cloud storage service used for storing doctor and patient profile images.

---

## Requirements

### Requirement 1: Patient Registration and Login

**User Story:** As a Patient, I want to register and log in to the platform, so that I can book and manage my appointments securely.

#### Acceptance Criteria

1. WHEN a new Patient submits a registration form with a unique email, a password between 8 and 128 characters, and a full name between 1 and 100 characters, THE Auth_Service SHALL create a Patient account and return a signed JWT with a 7-day expiry.
2. IF a Patient submits a registration form with an email that already exists in the database, THEN THE Auth_Service SHALL return a 400 error response indicating the email is already in use.
3. IF a Patient submits a registration form with a password fewer than 8 characters or more than 128 characters, THEN THE Auth_Service SHALL return a 400 error response indicating the password length requirement.
4. IF a Patient submits a registration form with any required field (email, password, full name) missing or empty, THEN THE Auth_Service SHALL return a 400 error response indicating which fields are missing.
5. WHEN a registered Patient submits valid login credentials (email and password), THE Auth_Service SHALL return a signed JWT with a 7-day expiry.
6. IF a Patient submits login credentials with an unregistered email or incorrect password, THEN THE Auth_Service SHALL return a 401 error response indicating the credentials are invalid, without specifying which field is incorrect.
7. THE Auth_Service SHALL store Patient passwords as a bcrypt hash before persisting them to the database; the plain-text password SHALL NOT be stored.
8. WHEN a Patient successfully logs in, THE Patient_Portal SHALL persist the JWT in client-side storage and navigate the Patient to the home page without a full page reload.

---

### Requirement 2: Doctor Login

**User Story:** As a Doctor, I want to log in to my dedicated dashboard, so that I can manage my appointments and profile.

#### Acceptance Criteria

1. WHEN a Doctor submits valid login credentials (email and password) to the doctor login endpoint, THE Auth_Service SHALL return a signed Doctor JWT with a 7-day expiry.
2. IF a Doctor submits an unrecognized email or incorrect password, THEN THE Auth_Service SHALL return a 401 error response indicating the credentials are invalid, without specifying which field is incorrect.
3. THE System SHALL issue Doctor JWTs with a role claim of "doctor"; if a token with a role other than "doctor" is presented to a doctor-protected endpoint, THE System SHALL return a 401 error response.
4. WHEN a Doctor successfully logs in, THE Doctor_Dashboard SHALL persist the Doctor JWT in the browser session and navigate the Doctor to the appointments view.
5. IF a Doctor submits 5 consecutive failed login attempts within any 15-minute window, THEN THE Auth_Service SHALL reject further login attempts for that email address for 15 minutes and return a 429 error response indicating the account is temporarily locked.

---

### Requirement 3: Admin Login

**User Story:** As an Admin, I want to log in to the admin panel, so that I can manage the entire platform.

#### Acceptance Criteria

1. WHEN an Admin submits valid credentials (email and password) to the admin login endpoint, THE Auth_Service SHALL return a signed Admin JWT with a 7-day expiry.
2. IF an Admin submits invalid credentials, THEN THE Auth_Service SHALL return a 401 error response indicating the credentials are invalid.
3. THE System SHALL issue Admin JWTs with a role claim of "admin"; a token with any other role presented to an admin-scoped endpoint SHALL result in a 403 error response, and a patient or doctor token SHALL NOT grant access to admin endpoints.
4. WHEN an Admin successfully logs in, THE Admin_Panel SHALL persist the Admin JWT in client-side storage and navigate the Admin to the dashboard overview.
5. IF the admin login endpoint receives a request with a missing or malformed payload (e.g., missing email or password fields), THEN THE Auth_Service SHALL return a 400 error response indicating the required fields.

---

### Requirement 4: Patient Profile Management

**User Story:** As a Patient, I want to update my personal profile, so that my information is current for my appointments.

#### Acceptance Criteria

1. WHEN an authenticated Patient submits a profile update request, THE System SHALL accept updates to the following fields with the listed constraints: full name (required, 1–100 characters), phone number (required, 7–15 digits), date of birth (required, must be a past date), gender (optional), and address (optional, maximum 255 characters).
2. WHEN a Patient uploads a new profile photo, THE Upload_Service SHALL upload the image to Cloudinary and store the returned image URL in the Patient's database record.
3. IF a Patient uploads a profile photo larger than 5 MB, THEN THE Upload_Service SHALL return a 400 error response with the message "Image size must not exceed 5 MB".
4. IF a Patient uploads a profile photo in a format other than JPEG, PNG, or WebP, THEN THE Upload_Service SHALL return a 400 error response with the message "Unsupported image format".
5. WHEN a Patient saves profile changes successfully, THE System SHALL return the updated Patient profile object containing the Patient's id, full name, email, phone number, date of birth, gender, address, and profile photo URL.
6. IF a Patient submits a profile update request with invalid field values (e.g., name exceeds 100 characters, invalid date of birth, address exceeds 255 characters), THEN THE System SHALL return a 400 error response with field-specific error details and SHALL NOT modify the stored profile data.

---

### Requirement 5: Doctor Listing and Specialty Filter

**User Story:** As a Patient, I want to browse and filter doctors by specialty, so that I can find the right doctor for my needs.

#### Acceptance Criteria

1. THE Doctor_Service SHALL expose a public endpoint that returns a paginated list (maximum 50 doctors per page) of all Doctors with availability status "available", including their name, specialty, profile photo URL, and consultation fee in USD.
2. WHEN a Patient applies a specialty filter, THE Doctor_Service SHALL return only Doctors whose specialty matches the selected filter value using a case-insensitive exact match.
3. WHEN no specialty filter is applied, THE Doctor_Service SHALL return all available Doctors up to the page limit.
4. THE Patient_Portal SHALL display Doctors in a responsive grid: 1 column on viewports narrower than 640px, 2 columns between 640px and 1023px, and 3 or more columns at 1024px and wider. Each card SHALL show the Doctor's photo, name, specialty, and fee.
5. WHEN the Doctor list is loading, THE Patient_Portal SHALL display a skeleton loading state in place of the Doctor cards.
6. WHEN no Doctors match the applied specialty filter, THE Patient_Portal SHALL display an empty state message: "No doctors found for this specialty."
7. IF THE Doctor_Service returns an error or is unreachable, THEN THE Patient_Portal SHALL display a user-friendly error message and a retry option, without exposing internal error details.
8. WHEN no Doctors exist in the system and no specialty filter is applied, THE Patient_Portal SHALL display an empty state message indicating no doctors are currently available.

---

### Requirement 6: Doctor Detail and Slot Selection

**User Story:** As a Patient, I want to view a doctor's profile and available time slots, so that I can choose a convenient appointment time.

#### Acceptance Criteria

1. WHEN a Patient navigates to a Doctor's detail page, THE Patient_Portal SHALL display the Doctor's full name, photo, specialty, years of experience, education, bio, and consultation fee.
2. WHEN a Patient navigates to a Doctor's detail page, THE Appointment_Service SHALL compute available slots for that Doctor for the next 7 calendar days, excluding slots that are already booked and excluding slots whose start time is earlier than the current server timestamp.
3. WHEN a Doctor's availability toggle is set to unavailable, THE Appointment_Service SHALL return an empty slot list for that Doctor.
4. WHEN the available slot list for a Doctor is non-empty, THE Patient_Portal SHALL display the slots grouped by date, with each slot rendered as a selectable button labeled with the slot start time in 12-hour format (e.g., "10:00 AM").
5. WHEN a Patient selects a date and time slot, THE Patient_Portal SHALL apply a visually distinct selected state to that slot button (e.g., filled background, contrasting text color) and enable the "Book Appointment" button; all other slot buttons SHALL revert to their unselected state.
6. Slots SHALL be generated in 30-minute intervals starting at 09:00 and ending at 20:30 in the Doctor's registered timezone, yielding 24 slots per day.
7. WHEN a Doctor has no available slots for any of the next 7 days (all slots booked or Doctor is unavailable), THE Patient_Portal SHALL display a message indicating no slots are currently available and SHALL NOT render the "Book Appointment" button.

---

### Requirement 7: Appointment Booking

**User Story:** As a Patient, I want to book an appointment with a doctor, so that I can schedule a consultation.

#### Acceptance Criteria

1. WHILE a Patient is authenticated and has selected a Doctor, date, and time slot, WHEN the Patient confirms the booking, THE Appointment_Service SHALL create a new Appointment record with status "pending" and persist it to the database.
2. WHEN an Appointment is successfully created, THE Appointment_Service SHALL atomically mark the selected slot as booked in the Doctor's slot data within the same database operation to prevent double-booking.
3. IF a Patient attempts to book a slot that has already been booked by another Patient, THEN THE Appointment_Service SHALL return a 409 error response indicating the slot is no longer available, and no Appointment record SHALL be created.
4. IF a Patient attempts to book an appointment without a valid authentication token, THEN THE System SHALL return a 401 error response indicating authentication is required.
5. WHEN an Appointment is successfully created, THE Appointment_Service SHALL return the Appointment object containing at minimum: appointment ID, doctor ID, doctor name, doctor specialty, patient ID, patient name, appointment date, time slot, consultation fee, and appointment status.
6. WHEN an Appointment is created successfully, THE Patient_Portal SHALL navigate the Patient to their appointments list page.
7. IF a Patient attempts to book a slot for a Doctor and date combination that the same Patient has already booked and not cancelled, THEN THE Appointment_Service SHALL return a 409 error response indicating a duplicate booking for that slot.
8. IF the Appointment record is created but the slot-marking operation fails, THEN THE Appointment_Service SHALL roll back the Appointment record creation so that neither the Appointment nor the slot-booking persists.

---

### Requirement 8: Patient Appointment Management

**User Story:** As a Patient, I want to view and cancel my appointments, so that I can manage my schedule.

#### Acceptance Criteria

1. WHEN an authenticated Patient requests their appointment list, THE Appointment_Service SHALL return all Appointments belonging to that Patient sorted by appointment date descending; IF the Patient has no appointments, THE Appointment_Service SHALL return an empty list.
2. WHEN the Patient's appointment list renders, THE Patient_Portal SHALL display each Appointment showing the Doctor's name, specialty, photo, appointment date, time slot, status, and fee formatted to two decimal places with a currency symbol.
3. WHEN a Patient cancels an Appointment with status "pending", THE Appointment_Service SHALL update the Appointment status to "cancelled" and mark the corresponding slot as available so other Patients can book it.
4. IF the cancellation operation fails due to a server or database error, THEN THE Appointment_Service SHALL return a 500 error response and the Appointment status SHALL remain unchanged.
5. IF a Patient attempts to cancel an Appointment with status "completed" or "cancelled", THEN THE Appointment_Service SHALL return a 400 error response indicating the appointment cannot be cancelled in its current state.
6. IF a Patient attempts to cancel an Appointment that does not belong to them, THEN THE Appointment_Service SHALL return a 403 error response indicating an unauthorized action.
7. WHEN an Appointment status is "completed", THE Patient_Portal SHALL display a "Completed" badge for that appointment.
8. WHEN an Appointment status is "cancelled", THE Patient_Portal SHALL display a "Cancelled" badge for that appointment.
9. WHEN an Appointment status is "pending", THE Patient_Portal SHALL display a "Pay Now" button and a "Cancel" button for that appointment.

---

### Requirement 9: Online Payment via Razorpay

**User Story:** As a Patient, I want to pay for my appointment online, so that I can confirm and secure my booking.

#### Acceptance Criteria

1. WHEN a Patient clicks "Pay Now" for a pending Appointment with payment status "unpaid", THE Payment_Service SHALL create a Razorpay order using the Appointment's consultation fee and return the Razorpay order ID to the Patient_Portal.
2. WHEN the Razorpay payment flow completes successfully, THE Patient_Portal SHALL send the Razorpay payment ID, order ID, and signature to the Payment_Service for verification.
3. WHEN THE Payment_Service verifies the Razorpay signature successfully, THE Payment_Service SHALL update the Appointment record's payment status to "paid".
4. IF the Razorpay signature verification fails, THEN THE Payment_Service SHALL return a 400 error response indicating payment verification failed, and the Appointment payment status SHALL remain unchanged.
5. WHEN an Appointment's payment status is "paid", THE Patient_Portal SHALL display a "Paid" indicator in place of the "Pay Now" button.
6. THE Payment_Service SHALL retrieve the Razorpay secret key exclusively from a server-side environment variable.
7. THE System SHALL NOT include the Razorpay secret key in any client-facing API response or frontend bundle.
8. IF the Razorpay order creation call fails (e.g., network error, invalid API key), THEN THE Payment_Service SHALL return a 502 error response indicating the payment service is temporarily unavailable, and no order ID SHALL be returned to the client.
9. IF a Patient attempts to initiate payment for an Appointment with payment status "paid" or with status "cancelled", THEN THE Payment_Service SHALL return a 400 error response indicating payment is not applicable for that appointment.

---

### Requirement 10: Doctor Dashboard — Appointment Management

**User Story:** As a Doctor, I want to view and manage my appointments, so that I can stay organized and serve my patients effectively.

#### Acceptance Criteria

1. WHEN an authenticated Doctor requests their appointment list, THE Appointment_Service SHALL return all Appointments assigned to that Doctor sorted by appointment date descending; IF the Doctor has no appointments, THE Appointment_Service SHALL return an empty list.
2. WHEN the Doctor's appointment list renders, THE Doctor_Dashboard SHALL display each Appointment showing the Patient's name, profile photo, appointment date, time slot, fee, and current status.
3. WHEN a Doctor marks an Appointment as completed, THE Appointment_Service SHALL update the Appointment status from "pending" to "completed"; IF the status is not "pending", THE Appointment_Service SHALL return a 400 error response indicating an invalid status transition.
4. WHEN a Doctor cancels an Appointment with status "pending", THE Appointment_Service SHALL update the Appointment status to "cancelled" and mark the corresponding slot as available.
5. IF a Doctor attempts to complete or cancel an Appointment that is not assigned to them, THEN THE System SHALL return a 403 error response indicating an unauthorized action.
6. IF a Doctor attempts to cancel an Appointment that is already "completed" or "cancelled", THEN THE Appointment_Service SHALL return a 400 error response indicating an invalid status transition.

---

### Requirement 11: Doctor Dashboard — Earnings and Stats

**User Story:** As a Doctor, I want to view my earnings and appointment statistics, so that I can track my performance.

#### Acceptance Criteria

1. WHEN an authenticated Doctor requests their dashboard stats, THE Doctor_Service SHALL compute and return the Doctor's total earnings as the sum of consultation fees for all Appointments assigned to that Doctor with status "completed".
2. WHEN an authenticated Doctor requests their dashboard stats, THE Doctor_Service SHALL return the count of that Doctor's total appointments, total completed appointments, and total pending appointments.
3. WHEN the Doctor navigates to the dashboard overview page, THE Doctor_Dashboard SHALL display the total earnings, total appointments, total completed appointments, and total pending appointments.
4. WHEN the Doctor navigates to the dashboard overview page, THE Doctor_Dashboard SHALL display the 5 most recent Appointments (by appointment date descending) assigned to that Doctor; IF the Doctor has fewer than 5 appointments, all available appointments SHALL be displayed.

---

### Requirement 12: Doctor Profile Management

**User Story:** As a Doctor, I want to update my profile information, so that Patients see accurate and current details about me.

#### Acceptance Criteria

1. WHEN an authenticated Doctor submits a profile update request, THE Doctor_Service SHALL accept updates to the following fields: consultation fee (required, positive number in the range 0.01–99,999.99), clinic address (required, maximum 200 characters), availability toggle (required, boolean), and bio (optional, maximum 500 characters).
2. WHEN a Doctor toggles their availability to false, THE Doctor_Service SHALL persist the updated availability field, and subsequent calls to the slot-generation endpoint for that Doctor SHALL return an empty slot list.
3. IF a Doctor submits a consultation fee value of zero or less, THEN THE Doctor_Service SHALL return a 400 error response indicating the fee must be a positive number.
4. IF a Doctor submits a bio exceeding 500 characters or a clinic address exceeding 200 characters, THEN THE Doctor_Service SHALL return a 400 error response with field-specific validation details and SHALL NOT modify the stored profile.
5. WHEN a Doctor saves valid profile changes, THE System SHALL return the updated Doctor profile object containing the fields submitted in the update request.
6. IF THE Doctor_Service cannot persist the profile changes due to a database error, THEN THE System SHALL return a 500 error response and the stored profile data SHALL remain unchanged.

---

### Requirement 13: Admin — Doctor Management

**User Story:** As an Admin, I want to add and manage doctors, so that the platform's doctor roster is accurate and up to date.

#### Acceptance Criteria

1. WHEN an Admin submits a new Doctor form with name, specialty, email, password, fee, experience (in years), education, address, bio, and a profile photo, THE Doctor_Service SHALL create a new Doctor account and store all provided fields.
2. THE Upload_Service SHALL upload the Doctor's profile photo to Cloudinary and store the returned URL in the Doctor's database record at the time of account creation.
3. IF an Admin submits a new Doctor form with an email that already exists in the database, THEN THE Doctor_Service SHALL return a 400 error response with the message "Email already registered".
4. THE Auth_Service SHALL hash the Doctor's initial password using bcrypt with a salt round of 10 before storing it.
5. WHEN an authenticated Admin requests the doctor list, THE Doctor_Service SHALL return all Doctors (both available and unavailable) without pagination limits for the Admin's management view.
6. WHEN the Admin doctor list renders, THE Admin_Panel SHALL display a table with columns for each Doctor's name, specialty, email, fee, and availability status.

---

### Requirement 14: Admin — Appointment Management

**User Story:** As an Admin, I want to view and cancel any appointment in the system, so that I can resolve scheduling conflicts and support patients.

#### Acceptance Criteria

1. WHEN an authenticated Admin requests the system appointment list, THE Appointment_Service SHALL return all Appointments sorted by appointment date descending; IF no appointments exist, THE Appointment_Service SHALL return an empty list.
2. WHEN the Admin appointment list renders, THE Admin_Panel SHALL display each Appointment showing the Patient's name, Doctor's name, specialty, date, time slot, fee, and status.
3. WHEN an Admin cancels an Appointment with status "pending", THE Appointment_Service SHALL update the Appointment status to "cancelled" and mark the corresponding slot as available.
4. IF an Admin attempts to cancel an Appointment with status "completed" or "cancelled", THEN THE Appointment_Service SHALL return a 400 error response indicating the appointment cannot be cancelled in its current state.
5. IF THE Appointment_Service is unavailable or returns an error when loading the appointment list, THEN THE Admin_Panel SHALL display a user-friendly error message with a retry option.

---

### Requirement 15: Admin — Dashboard Statistics

**User Story:** As an Admin, I want to view platform-wide statistics, so that I can monitor the health and activity of the system.

#### Acceptance Criteria

1. WHEN an authenticated Admin navigates to the dashboard overview, THE Doctor_Service SHALL return the total count of all registered Doctors.
2. WHEN an authenticated Admin navigates to the dashboard overview, THE Appointment_Service SHALL return the total count of all Appointments in the system.
3. WHEN an authenticated Admin navigates to the dashboard overview, THE Auth_Service SHALL return the total count of all registered Patients.
4. WHEN the Admin dashboard overview renders, THE Admin_Panel SHALL display total Doctors, total Patients, and total Appointments as stat cards.
5. WHEN the Admin dashboard overview renders, THE Admin_Panel SHALL display the 5 most recent Appointments (by scheduled date descending), each showing the Patient name, Doctor name, and appointment date; IF fewer than 5 appointments exist, all available appointments SHALL be shown.
6. IF any of the statistics services return an error, THEN THE Admin_Panel SHALL display a user-friendly error indicator for the affected stat card without blocking the rest of the dashboard from rendering.

---

### Requirement 16: Role-Based Access Control

**User Story:** As a system operator, I want API endpoints protected by role-based JWT validation, so that users can only access resources appropriate to their role.

#### Acceptance Criteria

1. THE System SHALL validate the JWT on every protected request by verifying the token's signature against the server-side secret and confirming the token has not expired.
2. IF a request to a Patient-protected endpoint contains a missing, malformed, or expired JWT, THEN THE System SHALL return a 401 error response indicating authentication is required.
3. IF a request to a Doctor-protected endpoint contains a token whose role claim is not "doctor", THEN THE System SHALL return a 403 error response indicating access is denied.
4. IF a request to an Admin-protected endpoint contains a token whose role claim is not "admin", THEN THE System SHALL return a 403 error response indicating access is denied.
5. THE System SHALL store all JWT signing secrets exclusively in server-side environment variables; they SHALL NOT appear in source code, frontend bundles, or API responses.
6. WHEN a protected endpoint receives a JWT that is valid and has the correct role, THE System SHALL extract the user's identity from the token payload and make it available to the route handler without an additional database lookup.

---

### Requirement 17: Image Upload

**User Story:** As a system operator, I want all profile images to be stored on Cloudinary, so that image delivery is fast and storage is managed externally.

#### Acceptance Criteria

1. WHEN a Doctor or Patient profile photo is submitted to the upload endpoint, THE Upload_Service SHALL transfer the image to Cloudinary and, upon a successful response, store the returned secure URL in the corresponding Doctor or Patient database record.
2. WHEN Cloudinary returns a successful upload response, THE Upload_Service SHALL store the returned secure URL in the Doctor or Patient database record that initiated the upload request.
3. IF the Cloudinary upload call fails for any reason, THEN THE Upload_Service SHALL return a 500 error response indicating the image could not be uploaded, and the database record SHALL NOT be modified.
4. IF the Cloudinary upload succeeds but the subsequent database write to store the URL fails, THEN THE Upload_Service SHALL return a 500 error response indicating the profile could not be saved, and the caller SHALL NOT receive a success response.
5. THE Upload_Service SHALL accept images in JPEG, PNG, and WebP formats only.
6. IF an image is submitted in an unsupported format, THEN THE Upload_Service SHALL return a 400 error response indicating the format is not supported, and no upload attempt SHALL be made.
7. IF an image exceeds 5 MB in size, THEN THE Upload_Service SHALL return a 400 error response indicating the size limit, and no upload attempt SHALL be made.

---

### Requirement 18: Responsive and Modern UI

**User Story:** As any user (Patient, Doctor, or Admin), I want a clean, modern, and mobile-friendly interface, so that I can use the platform comfortably on any device.

#### Acceptance Criteria

1. THE Patient_Portal SHALL render without horizontal overflow, element overlap, or loss of interactive functionality on viewport widths from 320px to 2560px.
2. THE Doctor_Dashboard SHALL render without horizontal overflow, element overlap, or loss of interactive functionality on viewport widths from 320px to 2560px.
3. THE Admin_Panel SHALL render without horizontal overflow, element overlap, or loss of interactive functionality on viewport widths from 320px to 2560px.
4. WHEN any data fetch operation is in progress in THE Patient_Portal, a skeleton loading state SHALL be displayed in place of the content area; the skeleton SHALL be dismissed once data is received or an error is returned.
5. IF an API request fails in THE Patient_Portal, THEN a user-friendly error message SHALL be displayed that does not include stack traces, database error messages, or internal server error details.
6. IF an API request fails in THE Doctor_Dashboard, THEN a user-friendly error message SHALL be displayed that does not include stack traces, database error messages, or internal server error details.
7. IF an API request fails in THE Admin_Panel, THEN a user-friendly error message SHALL be displayed that does not include stack traces, database error messages, or internal server error details.
8. THE Patient_Portal SHALL apply CSS transitions with a duration of 300ms or less to all interactive elements including buttons, cards, navigation links, and form inputs.
9. WHERE a Patient performs a destructive action (appointment cancellation), THE Patient_Portal SHALL display a confirmation dialog before submitting the request; IF the Patient dismisses the dialog, THE Patient_Portal SHALL abort the request and leave the Appointment record unchanged.
10. WHERE a Doctor performs a destructive action (appointment cancellation), THE Doctor_Dashboard SHALL display a confirmation dialog before submitting the request; IF the Doctor dismisses the dialog, THE Doctor_Dashboard SHALL abort the request and leave the Appointment record unchanged.
11. WHERE an Admin performs a destructive action (appointment cancellation or user account deletion), THE Admin_Panel SHALL display a confirmation dialog before submitting the request; IF the Admin dismisses the dialog, THE Admin_Panel SHALL abort the request and leave the record unchanged.
12. WHEN any data fetch operation is in progress in THE Doctor_Dashboard or THE Admin_Panel, a skeleton loading state or loading indicator SHALL be displayed in place of the content area; it SHALL be dismissed once data is received or an error is returned.

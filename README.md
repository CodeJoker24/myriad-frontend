# Myriad Academy Portal — Frontend Application

The frontend interface for **Myriad Academy Portal**, built as a modern React-based school management platform.

This application provides role-based dashboards and user interfaces for:

* Administrators
* Teachers
* Students

It communicates with the Myriad Academy backend API and Supabase services to handle authentication, profiles, and school management operations.

---

# Features

## Role-Based Dashboard System

The platform provides separate experiences for:

* Admin dashboard
* Teacher dashboard
* Student dashboard

Each role has access to different sections and management features.

---

## School Management Interface

Admin users can access:

* Student management
* Teacher management
* Attendance management
* School administration tools

---

## Authentication Integration

The frontend connects with Supabase authentication and backend API services for:

* Login
* Registration
* Session handling
* User profile access

---

## File and Data Handling

The application supports:

* Image uploads
* File exporting
* Spreadsheet processing
* Data formatting

---

# Technology Stack

| Technology   | Purpose                                |
| ------------ | -------------------------------------- |
| React 19     | Frontend framework                     |
| Vite         | Development/build tool                 |
| React Router | Application routing                    |
| Supabase JS  | Authentication and database connection |
| Axios        | API communication                      |
| Bootstrap    | UI styling framework                   |
| Tailwind CSS | Utility styling                        |
| SweetAlert2  | User notifications                     |
| Swiper       | Interactive components                 |
| XLSX         | Spreadsheet processing                 |
| PapaParse    | CSV processing                         |
| date-fns     | Date utilities                         |

---

# Project Structure

```text
myriad-frontend-main/

├── public/
│
├── src/
│
│── assets/
│   └── images/
│
│── components/
│   ├── forms/
│   └── layout/
│
│── pages/
│   ├── admin/
│   │   └── dashboard/
│   │       └── school-management/
│   │           ├── attendance/
│   │           ├── students/
│   │           └── teachers/
│   │
│   ├── student/
│   │   └── dashboard/
│   │
│   └── teacher/
│       └── dashboard/
│
│── sections/
│
├── App.jsx
├── api.js
└── main.jsx
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/CodeJoker24/myriad-frontend.git

cd myriad-frontend
```

---

## Install Dependencies

```bash
npm install
```

---

# Environment Setup

Create a `.env` file in the project root:

```env
VITE_API_URL=your_backend_api_url

VITE_SUPABASE_URL=your_supabase_project_url

VITE_SUPABASE_ANON_KEY=your_supabase_public_key
```

---

# Running The Application

Development mode:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# Application Flow

Frontend:

```text
React Application
        |
        |
        v
Backend REST API
        |
        |
        v
Supabase Database/Auth
```

---

# Future Improvements

Planned upgrades:

* Advanced permission management
* Complete school reporting system
* More dashboard analytics
* Notification system
* Improved mobile responsiveness

---

# Author

**CODE_JOKER**

Myriad Academy Portal Frontend System

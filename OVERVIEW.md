## RPA Helpline – Product Overview

This document explains **what the RPA Helpline application is**, **who it is for**, and **the main features** in simple language.

---

### 1. What is this application?

RPA Helpline is a **two-part web platform**:

- **Frontend (React app)**: what end‑users see in the browser  
- **Backend (Node/Express + Supabase)**: APIs, data storage, authentication, business logic  

Together, they create a **marketplace and hub for RPA work**, where:

- Companies and clients can **post RPA projects and jobs**
- RPA freelancers, developers, and job seekers can **find work and apply**
- RPA trainers can **offer training programs** (currently limited to managing and listing, not creating new courses from the UI)

The goal is to be a **single place** for:

- RPA **projects** (client ↔ freelancer)
- RPA **jobs** (employer ↔ job seeker)

---

### 2. Who uses it? (User roles)

The system is built around multiple user roles:

- **Client** – companies/individuals who **post RPA projects** and hire freelancers
- **Employer** – organizations that **post job openings** for RPA roles
- **Freelancer** – independent RPA professionals who **apply to projects**
- **Developer / BA_PM** – delivery‑side professionals who also **search/apply to work**
- **Job Seeker** – candidates who **apply to job listings**
- **Trainer** – RPA experts who **run training programs** and manage their courses/learners

Each role has:

- A **role‑specific dashboard** (different stats and quick actions)
- Relevant **navigation items** (e.g. “Post Project”, “Browse Jobs”, “My Applications”, “My Courses”)

---

### 3. Main features (high level)

#### 3.1 Authentication & Profiles

- Email‑based authentication with JWT and Supabase
- Multiple **user types** stored in profiles (freelancer, client, employer, trainer, etc.)
- Extended profile data:
  - Skills, RPA platforms, certifications
  - Experience, education, portfolio
  - Company details (for clients/employers)

#### 3.2 Projects (Freelance work)

- **Clients** can:
  - Post RPA **projects** with budget, deadlines, skills, urgency
  - View and manage **applications** from freelancers
- **Freelancers / developers / BA/PM** can:
  - **Browse and filter** projects (by status, budget, urgency, etc.)
  - View **project details**
  - **Apply** with proposals

Backend endpoints: `GET/POST/PUT/DELETE /api/projects`, `POST /api/projects/:id/apply`, etc.  
Frontend pages: project list, project detail, dashboard sections.

#### 3.3 Jobs (Employment)

- **Employers** can:
  - Post **job listings** (title, description, salary range, location, remote/hybrid/onsite)
  - Manage their job postings and applications
- **Job seekers** and other candidate roles can:
  - **Browse and search** jobs
  - View **job details**
  - **Apply** to jobs

Backend endpoints: `GET/POST/PUT/DELETE /api/jobs`, `POST /api/jobs/:id/apply`, etc.  
Frontend pages: jobs listing, job detail, role dashboards.

#### 3.4 Talent & Profiles

- Public / searchable **talent directory** (freelancers, trainers, etc.) based on:
  - RPA platforms (UiPath, Automation Anywhere, Blue Prism, etc.)
  - Skills, experience level, rates, availability
- Clients/employers can **search and filter** talent from the frontend.

Backend endpoints: `/api/freelancers`, `/api/profiles`  
Frontend pages: `Talent/BrowseTalent`, profile pages, dashboard views.

#### 3.5 Training Programs

- **Training programs** stored in `training_programs` with:
  - Title, description, technologies, level, format, duration, price
  - Next batch date, max students, etc.
- Current capabilities:
  - Users can **browse training programs** and view **course details**
  - **Enrollments** are tracked in the backend (`training_enrollments`)
  - Trainers can **see “My Courses”** and related stats in the trainer dashboard
- The “create course” UI route has been removed from the trainer dashboard; course creation is now controlled server‑side / out of the visible UI.

Backend endpoints: `/api/training`, `/api/training/:id`, `/api/training/:id/enroll`, `/api/training/me/*`  
Frontend pages: `Training/Courses`, `Training/CourseDetail`, trainer dashboard sections.

#### 3.6 Messaging & Notifications

- **Messaging**
  - Conversations and direct messages between users
  - Stored in `conversations` and `messages` tables
  - API for creating conversations, sending messages, muting, deleting
- **Notifications**
  - System notifications for events (applications, status changes, etc.)
  - Listing, mark‑as‑read, and bulk read endpoints

Backend endpoints: `/api/messages/*`, `/api/notifications/*`  
Frontend: dashboard notifications panel, messages views.

#### 3.7 Dashboards & Analytics

- Role‑specific dashboards show:
  - **Stats** (active projects, applications, profile views, courses, students, revenue, etc.)
  - **Recent activity** and notifications
  - **Quick actions** (e.g. post project, browse jobs, my courses, my applications)
- A single `Dashboard` page picks the right dashboard view depending on user role.

---

### 4. How frontend and backend work together

- The **frontend** calls the backend via the API layer in `src/services/api.js`
  - Example base URL: `VITE_API_BASE_URL=http://localhost:3000/api`
  - Auth tokens are stored and managed via Zustand stores
- The **backend** uses Supabase as a Postgres database + Row Level Security, and exposes REST‑like routes under `/api/*`
- Deployment is designed so that:
  - **One service** can serve both API and static frontend (Render/Node)
  - Frontend routes (React Router) handle client‑side navigation

---

### 5. Where to look in the code

- **Frontend**
  - `src/pages` – main screens (Home, Projects, Jobs, Dashboard, Training, etc.)
  - `src/components` – reusable UI, layout, and common components
  - `src/routes/index.jsx` – route configuration
  - `src/store` – Zustand stores (auth, projects, theme, toasts)
  - `src/services/api.js` – API client and logical grouping (authApi, projectsApi, jobsApi, trainingApi, etc.)

- **Backend**
  - `server/src/routes` – all API routes (auth, profiles, projects, jobs, training, messages, notifications, taxonomy, uploads, etc.)
  - `server/database/schema.sql` – full Postgres/Supabase schema
  - `server/src/middleware` – auth, validation, and error handling

Use this file as a **non‑technical orientation**; for full technical details, see `README.md` in the root and `server/README.md` in the `server` folder.


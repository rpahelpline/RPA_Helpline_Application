# RPA Helpline Backend Server v2.0

A comprehensive Express.js backend for the RPA Helpline Application with Supabase integration.

## 🎯 Supported User Types

| User Type | Description | Can Do |
|-----------|-------------|--------|
| **Freelancer** | RPA Developers for hire | Take projects, build portfolio |
| **Job Seeker** | Looking for RPA employment | Apply to jobs, upload resume |
| **Trainer** | RPA Training providers | Create courses, enroll students |
| **BA/PM** | Business Analysts & Project Managers | Offer consulting services |
| **Client** | Hire freelancers | Post projects, hire talent |
| **Employer** | Post job listings | Post jobs, hire employees |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

Create a `.env` file in the `server` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads
```

### 3. Setup Database

Run the SQL schema in your Supabase SQL Editor:
- Open `database/schema.sql`
- Copy and paste into Supabase SQL Editor
- Execute

**Migrations** (run in order if you have an existing DB):
- `database/migrations/add_otp_table.sql` – OTP, profiles fields (e.g. `resume_url`, `alternate_phone`)
- `database/migrations/ensure_resume_support.sql` – Ensures `profiles.resume_url` exists (idempotent)

**Supabase Storage:** Create a **`resumes`** bucket (and **`avatars`** if using cover/avatar uploads). The upload API will try to create them, but creating them in the Supabase dashboard is more reliable. Set bucket to **public** if resumes/avatars should be viewable via URL.

### 4. Start Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
server/
├── database/
│   └── schema.sql              # Complete database schema
├── src/
│   ├── config/
│   │   ├── constants.js        # Enums, user types, statuses
│   │   └── supabase.js         # Supabase client setup
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── errorHandler.js     # Error handling
│   │   └── validate.js         # Request validation
│   ├── routes/
│   │   ├── auth.js             # Authentication
│   │   ├── profiles.js         # User profiles
│   │   ├── projects.js         # Freelance projects
│   │   ├── freelancers.js      # Freelancer search
│   │   ├── jobs.js             # Job listings
│   │   ├── training.js         # Training programs
│   │   ├── taxonomy.js         # Platforms, skills, certs
│   │   ├── notifications.js    # User notifications
│   │   ├── messages.js         # Direct messaging
│   │   └── upload.js           # File uploads
│   └── index.js                # Express app entry
├── uploads/                    # Local file storage
├── package.json
└── README.md
```

## 📊 Database Schema

### Core Tables
- `users` - Authentication data
- `profiles` - Basic profile info for all users
- `rpa_platforms` - UiPath, AA, Blue Prism, etc.
- `skills` / `skill_categories` - Searchable skills
- `certifications` - RPA certifications

### Specialized Profiles
- `freelancer_profiles` - Rates, availability, portfolio
- `job_seeker_profiles` - Resume, job preferences
- `trainer_profiles` - Courses, ratings
- `ba_pm_profiles` - Methodologies, specializations
- `client_profiles` - Company info, hiring history
- `employer_profiles` - Company details

### User Skills & Experience
- `user_platforms` - Platform expertise
- `user_skills` - Skill proficiencies
- `user_certifications` - Earned certifications
- `user_experience` - Work history
- `user_education` - Education background
- `user_portfolio` - Project showcase

### Opportunities
- `projects` - Freelance opportunities
- `jobs` - Employment listings
- `training_programs` - Courses offered
- `training_requests` - Training needs

### Applications & Matching
- `project_applications` - Project proposals
- `job_applications` - Job applications
- `training_enrollments` - Course enrollments
- `training_proposals` - Trainer proposals

### Communication
- `conversations` - Chat threads
- `messages` - Individual messages
- `notifications` - User notifications

### Reviews & Contracts
- `reviews` - Ratings and feedback
- `contracts` - Work agreements
- `invoices` - Payment records

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - User login
POST   /api/auth/logout        - Logout
POST   /api/auth/refresh       - Refresh token
GET    /api/auth/me            - Get current user
PUT    /api/auth/password      - Update password
```

### Profiles
```
GET    /api/profiles           - Search profiles
GET    /api/profiles/:id       - Get profile by ID
GET    /api/profiles/me        - Get my full profile
PUT    /api/profiles/me        - Update my profile

POST   /api/profiles/me/platforms      - Add platform expertise
DELETE /api/profiles/me/platforms/:id  - Remove platform

POST   /api/profiles/me/skills         - Add skill
DELETE /api/profiles/me/skills/:id     - Remove skill

POST   /api/profiles/me/certifications - Add certification
DELETE /api/profiles/me/certifications/:id

POST   /api/profiles/me/experience     - Add experience
PUT    /api/profiles/me/experience/:id - Update experience
DELETE /api/profiles/me/experience/:id

POST   /api/profiles/me/portfolio      - Add portfolio item
DELETE /api/profiles/me/portfolio/:id
```

### Projects (Freelance)
```
GET    /api/projects           - Browse projects
GET    /api/projects/:id       - Get project details
POST   /api/projects           - Post new project (client)
PUT    /api/projects/:id       - Update project
DELETE /api/projects/:id       - Delete project
POST   /api/projects/:id/apply - Apply to project (freelancer)
GET    /api/projects/me/projects - My posted projects
```

### Freelancers
```
GET    /api/freelancers        - Search freelancers
GET    /api/freelancers/:id    - Get freelancer profile
GET    /api/freelancers/me/profile - My freelancer profile
PUT    /api/freelancers/me/profile - Update my profile
GET    /api/freelancers/me/applications - My applications
PATCH  /api/freelancers/me/availability
```

### Jobs
```
GET    /api/jobs               - Browse jobs
GET    /api/jobs/:id           - Get job details
POST   /api/jobs               - Post job (employer)
PUT    /api/jobs/:id           - Update job
DELETE /api/jobs/:id           - Delete job
POST   /api/jobs/:id/apply     - Apply to job
GET    /api/jobs/me/postings   - My job postings
```

### Training
```
GET    /api/training           - Browse programs
GET    /api/training/:id       - Get program details
POST   /api/training           - Create program (trainer)
PUT    /api/training/:id       - Update program
DELETE /api/training/:id       - Delete program
POST   /api/training/:id/enroll - Enroll in program
GET    /api/training/me/enrollments - My enrollments
GET    /api/training/me/programs - My programs (trainer)
```

### Taxonomy
```
GET    /api/taxonomy/platforms        - All RPA platforms
GET    /api/taxonomy/platforms/:slug  - Platform details
GET    /api/taxonomy/skills           - Skills by category
GET    /api/taxonomy/certifications   - All certifications
GET    /api/taxonomy/industries       - Industry list
GET    /api/taxonomy/company-sizes    - Company size options
GET    /api/taxonomy/experience-levels
GET    /api/taxonomy/search?q=        - Search all taxonomy
```

### Notifications
```
GET    /api/notifications      - My notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
DELETE /api/notifications/:id
```

### Messages
```
GET    /api/messages/conversations
GET    /api/messages/conversations/:id
POST   /api/messages/conversations
POST   /api/messages/conversations/:id/messages
DELETE /api/messages/conversations/:convId/messages/:msgId
PATCH  /api/messages/conversations/:id/mute
```

### Upload
```
POST   /api/upload/:type       - Upload file (avatar, resume, document)
POST   /api/upload/supabase/:bucket
DELETE /api/upload/supabase/:bucket/*
```

## 🔐 Authentication

Uses JWT tokens:

1. Register/Login returns `token` and `refreshToken`
2. Include in requests: `Authorization: Bearer <token>`
3. Token expires in 7 days
4. Use refresh endpoint for new tokens

## 🛡️ Security Features

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/15min general, 10 req/15min auth)
- JWT authentication
- Password hashing (bcrypt)
- Input validation
- Row Level Security (RLS) in database

## 🔍 Query Parameters

### Pagination
```
?page=1&limit=10
```

### Filtering (Projects)
```
?status=open
?urgency=high
?project_type=new_automation
?budget_type=fixed
?min_budget=1000
?max_budget=10000
?work_arrangement=remote
```

### Filtering (Freelancers)
```
?platform=uipath
?min_rate=50
?max_rate=150
?experience_level=senior
?is_available=true
```

### Sorting
```
?sort=created_at&order=desc
?sort=hourly_rate&order=asc
```

### Search
```
?search=uipath developer
```

## 📧 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3001 | Server port |
| NODE_ENV | No | development | Environment |
| SUPABASE_URL | Yes | - | Supabase project URL |
| SUPABASE_ANON_KEY | Yes | - | Supabase anon key |
| SUPABASE_SERVICE_ROLE_KEY | Yes | - | Supabase service key |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_EXPIRES_IN | No | 7d | Token expiry |
| FRONTEND_URL | No | http://localhost:5173 | CORS origin |
| MAX_FILE_SIZE | No | 5242880 | Max upload (bytes) |
| UPLOAD_DIR | No | ./uploads | Upload directory (relative to server cwd) |

## ✔ Database verification (resume & applications)

Ensure these exist for resume upload and job applications:

| Table | Column | Purpose |
|-------|--------|---------|
| `profiles` | `resume_url` | Profile dashboard resume; add via `ensure_resume_support.sql` or `add_otp_table.sql` |
| `job_applications` | `resume_url` | Resume attached to job application |
| `job_applications` | `employer_notes` | Employer/admin notes |
| `job_applications` | `viewed_at` | When application was viewed |

- **Uploads:** Local files go to `server/uploads/` (or `UPLOAD_DIR`). Static serving uses `server/uploads`; run the API from `server/` so paths match.
- **Supabase:** Use **`resumes`** bucket for resume uploads. PDF and Word (`.pdf`, `.doc`, `.docx`) allowed, max 5MB.

## 🧪 Testing

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## 📝 License

MIT License - RPA Helpline 2024

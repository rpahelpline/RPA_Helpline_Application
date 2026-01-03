// ============================================================================
// RPA HELPLINE - CONSTANTS & ENUMS
// ============================================================================

// User types
export const USER_TYPES = {
  FREELANCER: 'freelancer',      // RPA Freelancer/Developer for hire
  JOB_SEEKER: 'job_seeker',      // Looking for RPA jobs
  TRAINER: 'trainer',            // Provides RPA training
  BA_PM: 'ba_pm',                // Business Analyst / Project Manager
  CLIENT: 'client',              // Hires freelancers for projects
  EMPLOYER: 'employer'           // Posts full-time job listings
};

// User type labels
export const USER_TYPE_LABELS = {
  freelancer: 'RPA Freelancer',
  job_seeker: 'RPA Job Seeker',
  trainer: 'RPA Trainer',
  ba_pm: 'RPA BA/PM',
  client: 'Client',
  employer: 'Employer'
};

// Experience levels
export const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
  ARCHITECT: 'architect'
};

// Proficiency levels
export const PROFICIENCY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert'
};

// Freelancer availability
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  PARTIALLY_AVAILABLE: 'partially_available',
  BUSY: 'busy',
  NOT_AVAILABLE: 'not_available'
};

// Project types
export const PROJECT_TYPES = {
  NEW_AUTOMATION: 'new_automation',
  MAINTENANCE: 'maintenance',
  MIGRATION: 'migration',
  CONSULTING: 'consulting',
  TRAINING: 'training',
  POC: 'poc',
  COE_SETUP: 'coe_setup',
  OTHER: 'other'
};

// Project status
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  IN_REVIEW: 'in_review',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold'
};

// Project urgency
export const PROJECT_URGENCY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Budget types
export const BUDGET_TYPES = {
  HOURLY: 'hourly',
  FIXED: 'fixed',
  NEGOTIABLE: 'negotiable'
};

// Work arrangement
export const WORK_ARRANGEMENT = {
  REMOTE: 'remote',
  ONSITE: 'onsite',
  HYBRID: 'hybrid'
};

// Job employment types
export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
  FREELANCE: 'freelance'
};

// Job status
export const JOB_STATUS = {
  DRAFT: 'draft',
  OPEN: 'open',
  PAUSED: 'paused',
  CLOSED: 'closed',
  FILLED: 'filled'
};

// Application status (projects)
export const PROJECT_APPLICATION_STATUS = {
  PENDING: 'pending',
  VIEWED: 'viewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEW: 'interview',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// Application status (jobs)
export const JOB_APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  PHONE_SCREEN: 'phone_screen',
  INTERVIEW: 'interview',
  TECHNICAL_ROUND: 'technical_round',
  OFFER: 'offer',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

// Training program categories
export const TRAINING_CATEGORIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  CERTIFICATION_PREP: 'certification_prep',
  CORPORATE: 'corporate',
  BOOTCAMP: 'bootcamp'
};

// Training formats
export const TRAINING_FORMATS = {
  LIVE_ONLINE: 'live_online',
  SELF_PACED: 'self_paced',
  IN_PERSON: 'in_person',
  HYBRID: 'hybrid',
  CORPORATE_ONSITE: 'corporate_onsite'
};

// Training program status
export const TRAINING_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  SOLD_OUT: 'sold_out'
};

// Enrollment status
export const ENROLLMENT_STATUS = {
  ENROLLED: 'enrolled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  REFUNDED: 'refunded'
};

// Contract types
export const CONTRACT_TYPES = {
  PROJECT: 'project',
  JOB: 'job',
  TRAINING: 'training'
};

// Contract status
export const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

// Invoice status
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Review types
export const REVIEW_TYPES = {
  PROJECT_TO_FREELANCER: 'project_to_freelancer',
  PROJECT_TO_CLIENT: 'project_to_client',
  TRAINING_PROGRAM: 'training_program',
  TRAINER: 'trainer',
  EMPLOYER: 'employer'
};

// Notification types
export const NOTIFICATION_TYPES = {
  // Applications
  NEW_APPLICATION: 'new_application',
  APPLICATION_VIEWED: 'application_viewed',
  APPLICATION_SHORTLISTED: 'application_shortlisted',
  APPLICATION_ACCEPTED: 'application_accepted',
  APPLICATION_REJECTED: 'application_rejected',
  
  // Projects
  PROJECT_POSTED: 'project_posted',
  PROJECT_UPDATED: 'project_updated',
  PROJECT_COMPLETED: 'project_completed',
  
  // Jobs
  JOB_POSTED: 'job_posted',
  JOB_CLOSED: 'job_closed',
  
  // Messages
  NEW_MESSAGE: 'new_message',
  
  // Reviews
  NEW_REVIEW: 'new_review',
  
  // Contracts
  CONTRACT_SENT: 'contract_sent',
  CONTRACT_SIGNED: 'contract_signed',
  
  // Payments
  PAYMENT_RECEIVED: 'payment_received',
  INVOICE_SENT: 'invoice_sent',
  
  // System
  PROFILE_VERIFIED: 'profile_verified',
  SYSTEM_ANNOUNCEMENT: 'system_announcement'
};

// Conversation types
export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
  PROJECT: 'project',
  JOB_APPLICATION: 'job_application',
  TRAINING: 'training',
  SUPPORT: 'support'
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File upload limits
export const UPLOAD_LIMITS = {
  AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2MB
  RESUME_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ATTACHMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Rate limits
export const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  },
  AUTH: {
    windowMs: 15 * 60 * 1000,
    max: 10
  },
  UPLOAD: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20
  }
};

// Default platforms (for seeding)
export const DEFAULT_RPA_PLATFORMS = [
  { name: 'UiPath', slug: 'uipath' },
  { name: 'Automation Anywhere', slug: 'automation-anywhere' },
  { name: 'Blue Prism', slug: 'blue-prism' },
  { name: 'Microsoft Power Automate', slug: 'power-automate' },
  { name: 'WorkFusion', slug: 'workfusion' },
  { name: 'Pega', slug: 'pega' },
  { name: 'NICE', slug: 'nice' },
  { name: 'Kofax', slug: 'kofax' },
  { name: 'Appian', slug: 'appian' },
  { name: 'Nintex', slug: 'nintex' },
  { name: 'SAP Intelligent RPA', slug: 'sap-irpa' },
  { name: 'IBM RPA', slug: 'ibm-rpa' }
];

// Industries
export const INDUSTRIES = [
  'Banking & Finance',
  'Healthcare',
  'Insurance',
  'Retail & E-commerce',
  'Manufacturing',
  'Telecommunications',
  'Energy & Utilities',
  'Government',
  'Education',
  'Real Estate',
  'Logistics & Supply Chain',
  'Pharmaceuticals',
  'Automotive',
  'Media & Entertainment',
  'Hospitality',
  'Other'
];

// Company sizes
export const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
];

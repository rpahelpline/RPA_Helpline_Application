import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profiles.js';
import projectRoutes from './routes/projects.js';
import freelancerRoutes from './routes/freelancers.js';
import jobRoutes from './routes/jobs.js';
import trainingRoutes from './routes/training.js';
import taxonomyRoutes from './routes/taxonomy.js';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';
import otpRoutes from './routes/otp.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - Required when behind a reverse proxy (like Render, Heroku, etc.)
// This allows Express to correctly identify the client's IP address
// Set to 1 to only trust the first proxy hop (more secure for rate limiting)
app.set('trust proxy', 1);

// Security middleware
// In production, adjust helmet for serving static files
const helmetOptions = process.env.NODE_ENV === 'production' ? {
  contentSecurityPolicy: false, // Disable CSP to allow React app to work properly
} : {};
app.use(helmet(helmetOptions));

// CORS configuration
// In production, frontend and backend are on the same origin, so CORS is simpler
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // In production, frontend and backend are same origin, so allow same origin requests
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    // In development, allow localhost origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Response compression - reduces payload size by 30-50%
app.use(compression({
  level: 6, // Balanced compression level
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't want it
    if (req.headers['x-no-compression']) return false;
    // Use compression filter defaults
    return compression.filter(req, res);
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});
app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files for uploads
// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
  console.log(`[Uploads] Created uploads directory at: ${uploadsDir}`);
}
app.use('/uploads', express.static(uploadsDir));
console.log(`[Uploads] Serving static files from: ${uploadsDir}`);

// Serve frontend static files in production (from root dist folder)
// This must come before API routes so static assets are served first
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  console.log(`[Frontend] Serving static files from: ${distPath}`);
  
  // Check if dist folder exists
  if (!existsSync(distPath)) {
    console.error(`[Frontend] WARNING: dist folder not found at ${distPath}`);
    console.error('[Frontend] Make sure the build command runs before starting the server');
  } else {
    console.log(`[Frontend] ✓ dist folder found`);
  }
  
  // Serve static assets (CSS, JS, images, etc.)
  // Set proper headers for static files including images
  app.use(express.static(distPath, { 
    index: false,
    setHeaders: (res, filePath) => {
      // Set CORS headers for static assets
      res.set('Access-Control-Allow-Origin', '*');
      
      // Set cache headers for images
      if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.svg') || filePath.endsWith('.gif') || filePath.endsWith('.webp')) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        res.set('Content-Type', filePath.endsWith('.svg') ? 'image/svg+xml' : 
                              filePath.endsWith('.png') ? 'image/png' :
                              filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') ? 'image/jpeg' :
                              filePath.endsWith('.gif') ? 'image/gif' :
                              filePath.endsWith('.webp') ? 'image/webp' : 'image/png');
      }
    }
  }));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0'
  });
});

// =====================
// API Routes
// =====================

// Authentication
app.use('/api/auth', authRoutes);

// Profiles (user profiles, skills, experience, portfolio)
app.use('/api/profiles', profileRoutes);

// Projects (freelance opportunities)
app.use('/api/projects', projectRoutes);

// Freelancers (search, hire freelancers)
app.use('/api/freelancers', freelancerRoutes);

// Jobs (full-time employment)
app.use('/api/jobs', jobRoutes);

// Training (programs, enrollments)
app.use('/api/training', trainingRoutes);

// Taxonomy (platforms, skills, certifications)
app.use('/api/taxonomy', taxonomyRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Messages (conversations, direct messages)
app.use('/api/messages', messageRoutes);

// File uploads
app.use('/api/upload', uploadRoutes);

// OTP verification
app.use('/api/otp', otpRoutes);
app.use('/api/stats', statsRoutes);

// Admin panel (requires admin authentication)
app.use('/api/admin', adminRoutes);

// Support submissions
app.use('/api/support', supportRoutes);

// Error handling for API routes (before SPA fallback, only for /api routes)
app.use('/api', notFoundHandler);
app.use('/api', errorHandler);

// Serve frontend index.html for all non-API routes (SPA fallback) - must be LAST
// This handles GET requests for SPA routing (all other routes serve index.html)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  const indexPath = path.join(distPath, 'index.html');
  
  console.log(`[Frontend] SPA fallback configured`);
  console.log(`[Frontend] Dist path: ${distPath}`);
  console.log(`[Frontend] Index path: ${indexPath}`);
  console.log(`[Frontend] Index file exists: ${existsSync(indexPath)}`);
  
  // Handle ALL non-API routes with index.html for SPA routing
  // This must be the last route handler
  // Handle all HTTP methods for SPA routing (GET, POST for form submissions, etc.)
  app.all('*', (req, res, next) => {
    // Double-check: skip API routes (should already be handled, but just in case)
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
    }
    
    // Only handle GET requests for SPA routing (POST/PUT/DELETE should go to API)
    if (req.method !== 'GET') {
      return res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
    }
    
    // Check if index.html exists before trying to serve it
    if (!existsSync(indexPath)) {
      console.error(`[Frontend] ERROR: index.html not found at ${indexPath}`);
      return res.status(500).send(`
        <html>
          <body style="font-family: monospace; padding: 20px; background: #000; color: #fff;">
            <h1>Frontend Build Not Found</h1>
            <p>The frontend build was not found at: <code>${indexPath}</code></p>
            <p>Please ensure:</p>
            <ul>
              <li>The build command completed successfully</li>
              <li>The dist folder exists in the project root</li>
              <li>index.html exists in the dist folder</li>
            </ul>
          </body>
        </html>
      `);
    }
    
    console.log(`[Frontend] Serving index.html for route: ${req.path}`);
    
    // Set proper headers for HTML content
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    // Send index.html for all GET requests (SPA routing)
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error(`[Frontend] Error serving index.html for ${req.path}:`, err.message);
        console.error(`[Frontend] Index path was: ${indexPath}`);
        if (!res.headersSent) {
          res.status(500).send(`Error serving frontend: ${err.message}`);
        }
      } else {
        console.log(`[Frontend] ✓ Successfully served index.html for ${req.path}`);
      }
    });
  });
}

// Start server - listen on 0.0.0.0 for Render deployment
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? `${process.env.BACKEND_URL || `http://${HOST}:${PORT}`}/api`
    : `http://localhost:${PORT}/api`;
  
  console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║                                                                ║
  ║   🚀 RPA HELPLINE SERVER v2.0                                  ║
  ║                                                                ║
  ╠════════════════════════════════════════════════════════════════╣
  ║                                                                ║
  ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(45)}║
  ║   Host: ${String(HOST).padEnd(54)}║
  ║   Port: ${String(PORT).padEnd(53)}║
  ║   API URL: ${apiUrl.padEnd(47)}║
  ║                                                                ║
  ╠════════════════════════════════════════════════════════════════╣
  ║                                                                ║
  ║   USER TYPES SUPPORTED:                                        ║
  ║   • RPA Freelancer     - Take on automation projects           ║
  ║   • RPA Job Seeker     - Find full-time RPA positions          ║
  ║   • RPA Trainer        - Offer training programs               ║
  ║   • RPA BA/PM          - Business Analyst / Project Manager    ║
  ║   • Client             - Hire freelancers for projects         ║
  ║   • Employer           - Post job listings                     ║
  ║                                                                ║
  ╠════════════════════════════════════════════════════════════════╣
  ║                                                                ║
  ║   ENDPOINTS:                                                   ║
  ║   POST   /api/auth/register    - Register new user             ║
  ║   POST   /api/auth/login       - User login                    ║
  ║   GET    /api/auth/me          - Get current user              ║
  ║                                                                ║
  ║   GET    /api/profiles         - Search profiles               ║
  ║   GET    /api/profiles/me      - Get my full profile           ║
  ║   PUT    /api/profiles/me      - Update my profile             ║
  ║                                                                ║
  ║   GET    /api/projects         - Browse projects               ║
  ║   POST   /api/projects         - Post new project              ║
  ║                                                                ║
  ║   GET    /api/freelancers      - Search freelancers            ║
  ║   GET    /api/jobs             - Browse job listings           ║
  ║   GET    /api/training         - Browse training programs      ║
  ║                                                                ║
  ║   GET    /api/taxonomy/*       - Platforms, skills, certs      ║
  ║   GET    /api/notifications    - User notifications            ║
  ║   GET    /api/messages/*       - Conversations & messages      ║
  ║                                                                ║
  ╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

import { lazy, Suspense, memo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AdminProtectedRoute } from '../components/common/AdminProtectedRoute';
import { RoleProtectedRoute } from '../components/common/RoleProtectedRoute';
import { PageLoader } from '../components/common/LoadingSpinner';
import { PageTransition } from '../components/common/PageTransition';
import { ScrollToTop } from '../components/common/SmoothScroll';

// Helper function to lazy load named exports with preload support
const lazyLoad = (importFunc, exportName) => {
  const Component = lazy(() => 
    importFunc().then(module => {
      const component = module[exportName];
      if (!component) {
        const error = new Error(`Component ${exportName} not found in module`);
        console.error(`Error loading component ${exportName}:`, error.message);
        throw error;
      }
      return { default: component };
    }).catch(error => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error loading component ${exportName}:`, errorMessage);
      throw error;
    })
  );
  
  // Add preload method for performance
  Component.preload = importFunc;
  return Component;
};

// Lazy load all pages for better performance
const Home = lazyLoad(() => import('../pages/Home'), 'Home');
const SignIn = lazyLoad(() => import('../pages/SignIn'), 'SignIn');
const ForgotPassword = lazyLoad(() => import('../pages/ForgotPassword'), 'ForgotPassword');
const Projects = lazyLoad(() => import('../pages/Projects'), 'Projects');
const ProjectDetail = lazyLoad(() => import('../pages/ProjectDetail'), 'ProjectDetail');
const HowItWorks = lazyLoad(() => import('../pages/HowItWorks'), 'HowItWorks');
const Dashboard = lazyLoad(() => import('../pages/Dashboard'), 'Dashboard');
const Register = lazyLoad(() => import('../pages/Register'), 'Register');
const RegisterClient = lazyLoad(() => import('../pages/Register/RegisterClient'), 'RegisterClient');
const RegisterFreelancer = lazyLoad(() => import('../pages/Register/RegisterFreelancer'), 'RegisterFreelancer');
const RegisterDeveloper = lazyLoad(() => import('../pages/Register/RegisterDeveloper'), 'RegisterDeveloper');
const RegisterTrainer = lazyLoad(() => import('../pages/Register/RegisterTrainer'), 'RegisterTrainer');
const RegisterJobSeeker = lazyLoad(() => import('../pages/Register/RegisterJobSeeker'), 'RegisterJobSeeker');
const RegisterProject = lazyLoad(() => import('../pages/Register/RegisterProject'), 'RegisterProject');
const PublicProfile = lazyLoad(() => import('../pages/Profile/PublicProfile'), 'PublicProfile');
const Jobs = lazyLoad(() => import('../pages/Jobs'), 'Jobs');
const JobDetail = lazyLoad(() => import('../pages/Jobs/JobDetail'), 'JobDetail');
const NotFound = lazyLoad(() => import('../pages/NotFound'), 'NotFound');
const GitHubCallback = lazyLoad(() => import('../pages/Auth/GitHubCallback'), 'GitHubCallback');
const BrowseTalent = lazyLoad(() => import('../pages/Talent/BrowseTalent'), 'BrowseTalent');
const PostJob = lazyLoad(() => import('../pages/Jobs/PostJob'), 'PostJob');
const MyApplications = lazyLoad(() => import('../pages/Applications/MyApplications'), 'MyApplications');
const Messages = lazyLoad(() => import('../pages/Messages'), 'Messages');
const Notifications = lazyLoad(() => import('../pages/Notifications'), 'Notifications');
const SearchPage = lazyLoad(() => import('../pages/Search'), 'SearchPage');
const AdminDashboard = lazyLoad(() => import('../pages/Admin/AdminDashboard'), 'AdminDashboard');

// Training/Courses pages
const Courses = lazyLoad(() => import('../pages/Training/Courses'), 'Courses');
const CourseDetail = lazyLoad(() => import('../pages/Training/CourseDetail'), 'CourseDetail');
const CreateCourse = lazyLoad(() => import('../pages/Training/CreateCourse'), 'CreateCourse');
const EditCourse = lazyLoad(() => import('../pages/Training/EditCourse'), 'EditCourse');

// Smooth loading fallback
const SmoothLoader = memo(() => (
  <div 
    className="min-h-screen flex items-center justify-center bg-background"
    style={{
      animation: 'fadeIn 0.3s ease-out',
    }}
  >
    <PageLoader />
  </div>
));
SmoothLoader.displayName = 'SmoothLoader';

// Route wrapper with smooth transitions
const RouteWrapper = memo(({ children, withLayout = true }) => {
  if (withLayout) {
    return (
      <MainLayout>
        <PageTransition>
          <Suspense fallback={<SmoothLoader />}>
            {children}
          </Suspense>
        </PageTransition>
      </MainLayout>
    );
  }
  
  return (
    <PageTransition>
      <Suspense fallback={<SmoothLoader />}>
        {children}
      </Suspense>
    </PageTransition>
  );
});
RouteWrapper.displayName = 'RouteWrapper';

export const AppRoutes = () => {
  const location = useLocation();
  
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<SmoothLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public Routes */}
          <Route path="/" element={<RouteWrapper><Home /></RouteWrapper>} />
          <Route path="/sign-in" element={<RouteWrapper><SignIn /></RouteWrapper>} />
          <Route path="/forgot-password" element={<RouteWrapper><ForgotPassword /></RouteWrapper>} />
          <Route path="/projects" element={<RouteWrapper><Projects /></RouteWrapper>} />
          <Route path="/projects/:id" element={<RouteWrapper><ProjectDetail /></RouteWrapper>} />
          <Route path="/jobs" element={<RouteWrapper><Jobs /></RouteWrapper>} />
          <Route path="/jobs/:id" element={<RouteWrapper><JobDetail /></RouteWrapper>} />
          <Route path="/profile/:userId" element={<RouteWrapper><PublicProfile /></RouteWrapper>} />
          <Route 
            path="/talent" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['client', 'employer']}
                redirectTo="/dashboard"
                errorMessage="Only hiring members can browse talent. Switch to a hiring role to access this feature."
              >
                <RouteWrapper>
                  <BrowseTalent />
                </RouteWrapper>
              </RoleProtectedRoute>
            } 
          />
          <Route path="/search" element={<RouteWrapper><SearchPage /></RouteWrapper>} />
          <Route path="/courses" element={<RouteWrapper><Courses /></RouteWrapper>} />
          <Route path="/courses/:id" element={<RouteWrapper><CourseDetail /></RouteWrapper>} />
          <Route 
            path="/create-course" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['trainer']}
                redirectTo="/courses"
                errorMessage="Only trainers can create courses."
              >
                <RouteWrapper>
                  <CreateCourse />
                </RouteWrapper>
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="/courses/:id/edit" 
            element={
              <RoleProtectedRoute 
                allowedRoles={['trainer']}
                redirectTo="/courses"
                errorMessage="Only trainers can edit courses."
              >
                <RouteWrapper>
                  <EditCourse />
                </RouteWrapper>
              </RoleProtectedRoute>
            } 
          />
          <Route path="/how-it-works" element={<RouteWrapper><HowItWorks /></RouteWrapper>} />
          <Route path="/register" element={<RouteWrapper><Register /></RouteWrapper>} />
          <Route path="/register/client" element={<RouteWrapper><RegisterClient /></RouteWrapper>} />
          <Route path="/register/freelancer" element={<RouteWrapper><RegisterFreelancer /></RouteWrapper>} />
          <Route path="/register/developer" element={<RouteWrapper><RegisterDeveloper /></RouteWrapper>} />
          <Route path="/register/trainer" element={<RouteWrapper><RegisterTrainer /></RouteWrapper>} />
          <Route path="/register/jobseeker" element={<RouteWrapper><RegisterJobSeeker /></RouteWrapper>} />
          
          {/* OAuth Callbacks */}
          <Route path="/auth/github/callback" element={<RouteWrapper withLayout={false}><GitHubCallback /></RouteWrapper>} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RouteWrapper withLayout={false}>
                  <Dashboard />
                </RouteWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <RouteWrapper withLayout={false}>
                  <AdminDashboard />
                </RouteWrapper>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/register/project"
            element={
              <RoleProtectedRoute 
                allowedRoles={['client', 'employer']}
                redirectTo="/projects"
                errorMessage="Only clients and employers can post projects. Switch to a hiring role to post."
              >
                <RouteWrapper>
                  <RegisterProject />
                </RouteWrapper>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/post-job"
            element={
              <RoleProtectedRoute 
                allowedRoles={['employer', 'client']}
                redirectTo="/jobs"
                errorMessage="Only employers and clients can post jobs. Switch to a hiring role to post."
              >
                <RouteWrapper>
                  <PostJob />
                </RouteWrapper>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <RouteWrapper>
                  <MyApplications />
                </RouteWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <RouteWrapper withLayout={false}>
                  <Messages />
                </RouteWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <RouteWrapper>
                  <Notifications />
                </RouteWrapper>
              </ProtectedRoute>
            }
          />
          
          {/* 404 */}
          <Route path="*" element={<RouteWrapper><NotFound /></RouteWrapper>} />
        </Routes>
      </Suspense>
    </>
  );
};

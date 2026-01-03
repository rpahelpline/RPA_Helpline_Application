import { lazy, Suspense, memo } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
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
const ProfileSetup = lazyLoad(() => import('../pages/ProfileSetup'), 'ProfileSetup');
const Jobs = lazyLoad(() => import('../pages/Jobs'), 'Jobs');
const NotFound = lazyLoad(() => import('../pages/NotFound'), 'NotFound');
const GitHubCallback = lazyLoad(() => import('../pages/Auth/GitHubCallback'), 'GitHubCallback');

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
          <Route path="/projects" element={<RouteWrapper><Projects /></RouteWrapper>} />
          <Route path="/projects/:id" element={<RouteWrapper><ProjectDetail /></RouteWrapper>} />
          <Route path="/jobs" element={<RouteWrapper><Jobs /></RouteWrapper>} />
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
            path="/register/project"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <RouteWrapper>
                  <RegisterProject />
                </RouteWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile-setup"
            element={
              <ProtectedRoute>
                <RouteWrapper withLayout={false}>
                  <ProfileSetup />
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

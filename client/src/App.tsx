import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OnboardedRoute } from './components/layout/OnboardedRoute';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Profile = lazy(() => import('./pages/Profile'));
const Progress = lazy(() => import('./pages/Progress'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const Terms = lazy(() => import('./pages/Terms'));
const Today = lazy(() => import('./pages/Today'));
const Workout = lazy(() => import('./pages/Workout'));
const Routine = lazy(() => import('./pages/Routine'));
const ExerciseHistory = lazy(() => import('./pages/ExerciseHistory'));
const WorkoutPreview = lazy(() => import('./pages/WorkoutPreview'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/welcome" element={<Landing />} />
          <Route path="/preview-workout" element={<WorkoutPreview />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<OnboardedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Today />} />
                <Route path="/workout" element={<Workout />} />
                <Route path="/routine" element={<Routine />} />
                <Route path="/exercise/:key" element={<ExerciseHistory />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}


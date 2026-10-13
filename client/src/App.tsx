import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OnboardedRoute } from './components/layout/OnboardedRoute';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoadingSkeleton } from './components/ui/LoadingSkeleton';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Profile = lazy(() => import('./pages/Profile'));
const Progress = lazy(() => import('./pages/Progress'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const Today = lazy(() => import('./pages/Today'));
const Workout = lazy(() => import('./pages/Workout'));

export default function App() {
  return (
    <Suspense fallback={<div className="p-4"><LoadingSkeleton cards={3} /></div>}>
      <Routes>
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<OnboardedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Today />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}


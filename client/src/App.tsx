import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { OnboardedRoute } from './components/layout/OnboardedRoute';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import Today from './pages/Today';
import Workout from './pages/Workout';

export default function App() {
  return (
    <Routes>
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
  );
}

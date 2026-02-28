import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import TravellerDashboard from './pages/TravellerDashboard';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import React from 'react';
import { UserRole } from './backend';

type Page = 'register' | 'login' | 'admin' | 'driver' | 'traveller';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = React.useState<Page>('login');
  // Track whether the user has manually navigated (e.g. after registration)
  const manualNavRef = React.useRef(false);

  const isAuthenticated = !!identity;

  // Centralized navigation logic after login/registration
  React.useEffect(() => {
    // If the user manually navigated (e.g. just registered), skip auto-routing
    // until the profile is confirmed to have updated
    if (manualNavRef.current) {
      return;
    }

    if (isAuthenticated && isFetched && !profileLoading) {
      if (userProfile) {
        // User is registered, route to appropriate dashboard based on role and busNumber
        if (userProfile.role === UserRole.admin) {
          setCurrentPage('admin');
        } else if (userProfile.busNumber) {
          // User has a bus number, they're a driver
          setCurrentPage('driver');
        } else {
          // User is a traveller (role is 'user' and no busNumber)
          setCurrentPage('traveller');
        }
      } else {
        // User is authenticated but not registered, send to register page
        setCurrentPage('register');
      }
    } else if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'register') {
      // User is not authenticated and trying to access protected pages
      setCurrentPage('login');
    }
  }, [isAuthenticated, userProfile, profileLoading, isFetched]);

  // When the profile updates after a manual navigation, clear the manual nav flag
  // so future profile changes (e.g. logout) are handled automatically
  React.useEffect(() => {
    if (manualNavRef.current && isFetched && !profileLoading) {
      manualNavRef.current = false;
    }
  }, [userProfile, isFetched, profileLoading]);

  const handleNavigate = React.useCallback((page: Page) => {
    // Mark as manual navigation so the auto-routing effect doesn't override it
    manualNavRef.current = true;
    setCurrentPage(page);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'driver':
        return <DriverDashboard onNavigate={handleNavigate} />;
      case 'traveller':
        return <TravellerDashboard onNavigate={handleNavigate} />;
      default:
        return <LoginPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {renderPage()}
      <Toaster />
    </ThemeProvider>
  );
}

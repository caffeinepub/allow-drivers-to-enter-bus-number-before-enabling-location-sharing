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

  const isAuthenticated = !!identity;

  // Centralized navigation logic after login/registration
  React.useEffect(() => {
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
        if (currentPage !== 'register') {
          setCurrentPage('register');
        }
      }
    } else if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'register') {
      // User is not authenticated and trying to access protected pages
      setCurrentPage('login');
    }
  }, [isAuthenticated, userProfile, profileLoading, isFetched, currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'register':
        return <RegisterPage onNavigate={setCurrentPage} />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'admin':
        return <AdminDashboard onNavigate={setCurrentPage} />;
      case 'driver':
        return <DriverDashboard onNavigate={setCurrentPage} />;
      case 'traveller':
        return <TravellerDashboard onNavigate={setCurrentPage} />;
      default:
        return <LoginPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {renderPage()}
      <Toaster />
    </ThemeProvider>
  );
}

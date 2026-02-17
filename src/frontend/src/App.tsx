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

type Page = 'register' | 'login' | 'admin' | 'driver' | 'traveller';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = React.useState<Page>('login');

  const isAuthenticated = !!identity;

  const renderPage = () => {
    if (!isAuthenticated && currentPage !== 'register' && currentPage !== 'login') {
      return <LoginPage onNavigate={setCurrentPage} />;
    }

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

import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { toast } from 'sonner';

interface LoginPageProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function LoginPage({ onNavigate }: LoginPageProps) {
  const { login, loginStatus, identity } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
      // Navigation will be handled by App.tsx after profile is fetched
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    }
  };

  const isLoading = loginStatus === 'logging-in';

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div
        className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/generated/login-background.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Header onNavigate={onNavigate} currentPage="login" />

      <main className="flex-1 relative z-10 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in with Internet Identity to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Secure Authentication:</strong> We use Internet Identity for secure, privacy-preserving authentication. No passwords needed!
              </p>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Sign in with Internet Identity
                </>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('register')}
                className="text-blue-600 hover:underline font-medium"
              >
                Register here
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

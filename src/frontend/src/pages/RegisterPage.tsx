import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminRegister, useDriverRegister, useTravellerRegister, useGetCallerUserProfile } from '../hooks/useQueries';
import { toast } from 'sonner';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Bus, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { UserRole } from '../backend';

interface RegisterPageProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [driverBusNumber, setDriverBusNumber] = useState('');
  const { identity } = useInternetIdentity();
  const { refetch: refetchProfile } = useGetCallerUserProfile();

  const adminRegister = useAdminRegister();
  const driverRegister = useDriverRegister();
  const travellerRegister = useTravellerRegister();

  const isAuthenticated = !!identity;

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in first to register as an admin');
      return;
    }

    try {
      const result = await adminRegister.mutateAsync('admin');
      if (result.__kind__ === 'success') {
        toast.success('Admin registered successfully!');
        // Wait for profile to refresh before navigating
        const { data: profile } = await refetchProfile();
        if (profile && profile.role === UserRole.admin) {
          onNavigate('admin');
        }
      } else {
        toast.error(result.failure);
      }
    } catch (error: any) {
      console.error('Admin registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  const handleDriverRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in first to register as a driver');
      return;
    }
    
    const trimmedBusNumber = driverBusNumber.trim();
    
    if (!trimmedBusNumber) {
      toast.error('Please enter a bus number');
      return;
    }

    if (trimmedBusNumber !== driverBusNumber) {
      toast.error('Bus number cannot contain leading or trailing spaces');
      return;
    }

    try {
      const result = await driverRegister.mutateAsync(trimmedBusNumber);
      
      if (result.__kind__ === 'success') {
        toast.success('Driver registered successfully! You can now manage your bus.');
        setDriverBusNumber('');
        // Wait for profile to refresh before navigating
        const { data: profile } = await refetchProfile();
        if (profile && profile.busNumber) {
          onNavigate('driver');
        }
      } else {
        toast.error(result.failure);
      }
    } catch (error: any) {
      console.error('Driver registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    }
  };

  const handleTravellerRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in first to register as a traveller');
      return;
    }

    try {
      const result = await travellerRegister.mutateAsync();
      if (result.__kind__ === 'success') {
        toast.success('Traveller registered successfully!');
        // Wait for profile to refresh before navigating
        const { data: profile } = await refetchProfile();
        if (profile && !profile.busNumber && profile.role === UserRole.user) {
          onNavigate('traveller');
        }
      } else {
        toast.error(result.failure);
      }
    } catch (error: any) {
      console.error('Traveller registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div 
        className="absolute inset-0 opacity-10 dark:opacity-5"
        style={{
          backgroundImage: 'url(/assets/generated/login-background.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      <Header onNavigate={onNavigate} currentPage="register" />

      <main className="flex-1 relative z-10 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Choose your role to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {!isAuthenticated && (
              <Alert className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-900 dark:text-orange-100">
                  <strong>Authentication Required:</strong> Please sign in with Internet Identity before registering. You can sign in from the{' '}
                  <button
                    onClick={() => onNavigate('login')}
                    className="underline font-semibold hover:text-orange-700 dark:hover:text-orange-300"
                  >
                    login page
                  </button>.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="traveller" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger value="driver" className="gap-2">
                  <Bus className="w-4 h-4" />
                  Driver
                </TabsTrigger>
                <TabsTrigger value="traveller" className="gap-2">
                  <User className="w-4 h-4" />
                  Traveller
                </TabsTrigger>
              </TabsList>

              <TabsContent value="admin" className="space-y-4 mt-6">
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    <strong>Admin Role:</strong> Manage all drivers and travellers, view system status, and control user access.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleAdminRegister} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to register as an admin. Your account will be automatically configured.
                  </p>
                  <Button type="submit" className="w-full" disabled={adminRegister.isPending || !isAuthenticated}>
                    {adminRegister.isPending ? 'Registering...' : 'Register as Admin'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="driver" className="space-y-4 mt-6">
                <Alert className="bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
                  <Bus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <AlertDescription className="text-indigo-900 dark:text-indigo-100">
                    <strong>Driver Role:</strong> Share your bus location in real-time and manage your bus information.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleDriverRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bus-number">Bus Number</Label>
                    <Input
                      id="bus-number"
                      placeholder="e.g., BUS-101"
                      value={driverBusNumber}
                      onChange={(e) => setDriverBusNumber(e.target.value)}
                      disabled={driverRegister.isPending || !isAuthenticated}
                      required
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">Bus number must be 6-9 characters, no spaces</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={driverRegister.isPending || !isAuthenticated}>
                    {driverRegister.isPending ? 'Registering...' : 'Register as Driver'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="traveller" className="space-y-4 mt-6">
                <Alert className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                  <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <AlertDescription className="text-purple-900 dark:text-purple-100">
                    <strong>Traveller Role:</strong> Track buses in real-time by entering bus numbers and view their locations on the map.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleTravellerRegister} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to register as a traveller. Your account will be automatically configured.
                  </p>
                  <Button type="submit" className="w-full" disabled={travellerRegister.isPending || !isAuthenticated}>
                    {travellerRegister.isPending ? 'Registering...' : 'Register as Traveller'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in here
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

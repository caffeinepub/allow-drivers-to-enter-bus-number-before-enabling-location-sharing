import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminRegister, useDriverRegister, useTravellerRegister } from '../hooks/useQueries';
import { toast } from 'sonner';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Bus, User, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface RegisterPageProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function RegisterPage({ onNavigate }: RegisterPageProps) {
  const [adminName, setAdminName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverBusNumber, setDriverBusNumber] = useState('');
  const [busNumberError, setBusNumberError] = useState('');
  const [travellerName, setTravellerName] = useState('');
  const { identity } = useInternetIdentity();

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

    const trimmedName = adminName.trim();
    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }

    try {
      const result = await adminRegister.mutateAsync({ roleText: 'admin', name: trimmedName });
      if (result.__kind__ === 'success') {
        toast.success('Admin registered successfully!');
        onNavigate('admin');
      } else {
        toast.error(result.failure);
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  const handleDriverRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusNumberError('');

    if (!isAuthenticated) {
      toast.error('Please sign in first to register as a driver');
      return;
    }

    const trimmedName = driverName.trim();
    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }

    const trimmedBusNumber = driverBusNumber.trim();

    if (!trimmedBusNumber) {
      setBusNumberError('Please enter a bus number');
      toast.error('Please enter a bus number');
      return;
    }

    if (trimmedBusNumber !== driverBusNumber) {
      setBusNumberError('Bus number cannot contain leading or trailing spaces');
      toast.error('Bus number cannot contain leading or trailing spaces');
      return;
    }

    if (trimmedBusNumber.length < 6 || trimmedBusNumber.length > 9) {
      setBusNumberError('Bus number must be between 6 and 9 characters');
      toast.error('Bus number must be between 6 and 9 characters');
      return;
    }

    try {
      const result = await driverRegister.mutateAsync({ name: trimmedName, busNumber: trimmedBusNumber });

      if (result.__kind__ === 'success') {
        toast.success('Driver registered successfully! You can now manage your bus.');
        setDriverName('');
        setDriverBusNumber('');
        setBusNumberError('');
        onNavigate('driver');
      } else {
        setBusNumberError(result.failure);
        toast.error(result.failure);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setBusNumberError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleTravellerRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in first to register as a traveller');
      return;
    }

    const trimmedName = travellerName.trim();
    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }

    try {
      const result = await travellerRegister.mutateAsync({ name: trimmedName });
      if (result.__kind__ === 'success') {
        toast.success('Traveller registered successfully!');
        onNavigate('traveller');
      } else {
        toast.error(result.failure);
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

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

      <Header onNavigate={onNavigate} currentPage="register" />

      <main className="flex-1 relative z-10 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Create Account</CardTitle>
            <CardDescription>Choose your role and enter your details to get started</CardDescription>
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

            <Tabs defaultValue="driver" className="w-full">
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

              {/* Admin Tab */}
              <TabsContent value="admin" className="space-y-4 mt-6">
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    <strong>Admin Role:</strong> Manage all drivers and travellers, view system status, and control user access.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleAdminRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="adminName">Your Name</Label>
                    <Input
                      id="adminName"
                      placeholder="Enter your full name"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      disabled={adminRegister.isPending || !isAuthenticated}
                      autoComplete="name"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={adminRegister.isPending || !isAuthenticated}
                  >
                    {adminRegister.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Register as Admin
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Driver Tab */}
              <TabsContent value="driver" className="space-y-4 mt-6">
                <Alert className="bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
                  <Bus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <AlertDescription className="text-indigo-900 dark:text-indigo-100">
                    <strong>Driver Role:</strong> Share your bus location in real-time so travellers can track your route.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleDriverRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Your Name</Label>
                    <Input
                      id="driverName"
                      placeholder="Enter your full name"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      disabled={driverRegister.isPending || !isAuthenticated}
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="busNumber">Bus Number</Label>
                    <Input
                      id="busNumber"
                      placeholder="Enter your bus number (6-9 characters)"
                      value={driverBusNumber}
                      onChange={(e) => {
                        setDriverBusNumber(e.target.value);
                        setBusNumberError('');
                      }}
                      disabled={driverRegister.isPending || !isAuthenticated}
                      className={`font-mono ${busNumberError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {busNumberError && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {busNumberError}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Must be 6–9 characters, no spaces allowed
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={driverRegister.isPending || !isAuthenticated}
                  >
                    {driverRegister.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Bus className="w-4 h-4 mr-2" />
                        Register as Driver
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Traveller Tab */}
              <TabsContent value="traveller" className="space-y-4 mt-6">
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-900 dark:text-green-100">
                    <strong>Traveller Role:</strong> Track buses in real-time and get proximity alerts when your bus is nearby.
                  </AlertDescription>
                </Alert>
                <form onSubmit={handleTravellerRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="travellerName">Your Name</Label>
                    <Input
                      id="travellerName"
                      placeholder="Enter your full name"
                      value={travellerName}
                      onChange={(e) => setTravellerName(e.target.value)}
                      disabled={travellerRegister.isPending || !isAuthenticated}
                      autoComplete="name"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={travellerRegister.isPending || !isAuthenticated}
                  >
                    {travellerRegister.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Register as Traveller
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

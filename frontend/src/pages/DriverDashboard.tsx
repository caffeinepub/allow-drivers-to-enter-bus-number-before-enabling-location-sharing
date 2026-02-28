import React, { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useGetDriver, useToggleLocationSharing, useUpdateLocation, useDriverRegister } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BusMap from '../components/BusMap';
import { Bus, MapPin, Navigation, Loader2, Info, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Location } from '../backend';

interface DriverDashboardProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function DriverDashboard({ onNavigate }: DriverDashboardProps) {
  const { data: userProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerUserProfile();
  const busNumber = userProfile?.busNumber || '';
  const { data: driverData } = useGetDriver(busNumber);
  const toggleLocation = useToggleLocationSharing();
  const updateLocation = useUpdateLocation();
  const driverRegister = useDriverRegister();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [busNumberInput, setBusNumberInput] = useState('');
  const [busNumberError, setBusNumberError] = useState('');
  const [driverNameInput, setDriverNameInput] = useState('');

  const isSharing = driverData?.isSharingLocation || false;
  const hasBusNumber = !!busNumber;

  // Pre-fill name from profile if available
  useEffect(() => {
    if (userProfile?.name && !driverNameInput) {
      setDriverNameInput(userProfile.name);
    }
  }, [userProfile?.name]);

  // Simulate GPS location updates
  useEffect(() => {
    if (!isSharing || !busNumber) {
      setCurrentLocation(null);
      return;
    }

    // Start with a base location (simulated campus location)
    let lat = 40.7128 + (Math.random() - 0.5) * 0.01;
    let lng = -74.0060 + (Math.random() - 0.5) * 0.01;

    // Initial location update
    setCurrentLocation({ lat, lng });
    const initialLocation: Location = {
      latitude: lat,
      longitude: lng,
      timestamp: BigInt(Date.now() * 1000000),
    };
    updateLocation.mutate({ busNumber, location: initialLocation });

    const interval = setInterval(() => {
      // Simulate movement along a route
      lat += (Math.random() - 0.5) * 0.0005;
      lng += (Math.random() - 0.5) * 0.0005;

      setCurrentLocation({ lat, lng });

      const location: Location = {
        latitude: lat,
        longitude: lng,
        timestamp: BigInt(Date.now() * 1000000),
      };

      updateLocation.mutate({ busNumber, location });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [isSharing, busNumber]);

  const handleToggleSharing = async () => {
    if (!busNumber) {
      toast.error('Bus number not found');
      return;
    }

    try {
      const newState = await toggleLocation.mutateAsync(busNumber);

      if (newState) {
        setStatusMessage('Location sharing started');
        toast.success('Location sharing started', {
          description: `Bus ${busNumber} is now visible to all travellers`,
          icon: <CheckCircle2 className="w-5 h-5" />,
        });
      } else {
        setStatusMessage('Location sharing stopped');
        toast.success('Location sharing stopped', {
          description: `Bus ${busNumber} is no longer visible to travellers`,
          icon: <XCircle className="w-5 h-5" />,
        });
      }

      // Clear status message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle location sharing');
    }
  };

  const handleBusNumberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusNumberError('');

    // Client-side validation
    const trimmedName = driverNameInput.trim();
    const trimmedBusNumber = busNumberInput.trim();

    if (!trimmedName) {
      toast.error('Please enter your name');
      return;
    }

    if (!trimmedBusNumber) {
      setBusNumberError('Bus number is required');
      return;
    }

    if (trimmedBusNumber.includes(' ')) {
      setBusNumberError('Bus number cannot contain spaces');
      return;
    }

    if (trimmedBusNumber.length < 6 || trimmedBusNumber.length > 9) {
      setBusNumberError('Bus number must be between 6 and 9 characters');
      return;
    }

    try {
      const result = await driverRegister.mutateAsync({ name: trimmedName, busNumber: trimmedBusNumber });

      if (result.__kind__ === 'success') {
        toast.success('Bus number registered successfully', {
          description: 'You can now share your location with travellers',
          icon: <CheckCircle2 className="w-5 h-5" />,
        });
        setBusNumberInput('');
      } else {
        setBusNumberError(result.failure);
        toast.error('Registration failed', {
          description: result.failure,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to register bus number';
      setBusNumberError(errorMessage);
      toast.error('Registration failed', {
        description: errorMessage,
      });
    }
  };

  // Build a Location object from currentLocation for the map
  const driverMapLocation: Location | null = currentLocation
    ? {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        timestamp: BigInt(Date.now() * 1000000),
      }
    : null;

  // Show loading state while profile is being fetched
  if (profileLoading || !profileFetched) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header onNavigate={onNavigate} currentPage="driver" />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Loading dashboard...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div
        className="absolute inset-0 opacity-5 dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'url(/assets/generated/dashboard-background.dim_1920x1080.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <Header onNavigate={onNavigate} currentPage="driver" />

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Driver Dashboard</h1>
            <p className="text-muted-foreground">Manage your bus and share location with travellers</p>
          </div>

          {/* Bus Number Registration Form - shown when no bus number */}
          {!hasBusNumber && (
            <Card className="border-2 border-indigo-200 dark:border-indigo-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                    <Bus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Register Your Bus</CardTitle>
                    <CardDescription>Enter your details to start sharing location</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    You need to register a bus number before you can share your location with travellers.
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleBusNumberSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="driverName">Your Name</Label>
                    <Input
                      id="driverName"
                      type="text"
                      placeholder="Enter your full name"
                      value={driverNameInput}
                      onChange={(e) => setDriverNameInput(e.target.value)}
                      disabled={driverRegister.isPending}
                      autoComplete="name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="busNumber">Bus Number</Label>
                    <Input
                      id="busNumber"
                      type="text"
                      placeholder="Enter bus number (6-9 characters)"
                      value={busNumberInput}
                      onChange={(e) => {
                        setBusNumberInput(e.target.value);
                        setBusNumberError('');
                      }}
                      disabled={driverRegister.isPending}
                      className={busNumberError ? 'border-red-500' : ''}
                    />
                    {busNumberError && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {busNumberError}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Must be 6-9 characters, no spaces allowed
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={driverRegister.isPending}
                  >
                    {driverRegister.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register Bus Number'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          {hasBusNumber && statusMessage && (
            <Alert className={`border-2 ${isSharing ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'}`}>
              {isSharing ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <AlertDescription className={`font-medium ${isSharing ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Bus Info Card - only shown when bus number exists */}
          {hasBusNumber && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle>Bus Information</CardTitle>
                      <CardDescription>Your assigned bus details</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                    {busNumber}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Driver Name</p>
                    <p className="font-medium">{userProfile?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bus Number</p>
                    <p className="font-medium font-mono">{busNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Sharing Card - only shown when bus number exists */}
          {hasBusNumber && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Navigation className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Location Sharing</CardTitle>
                    <CardDescription>Enable to share your live location with travellers</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="location-toggle" className="text-base font-medium">
                      Share Live Location
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {isSharing ? 'Your location is being shared' : 'Location sharing is off'}
                    </p>
                  </div>
                  <Switch
                    id="location-toggle"
                    checked={isSharing}
                    onCheckedChange={handleToggleSharing}
                    disabled={toggleLocation.isPending}
                  />
                </div>

                {isSharing && (
                  <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-900 dark:text-blue-100">
                      <strong>Bus {busNumber}</strong> is now visible to all travellers. They can track your location in real-time.
                    </AlertDescription>
                  </Alert>
                )}

                {isSharing && currentLocation && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Current Location
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="text-xs text-muted-foreground">Latitude</p>
                        <p className="font-mono text-sm">{currentLocation.lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Longitude</p>
                        <p className="font-mono text-sm">{currentLocation.lng.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Updating location every 3 seconds
                    </div>
                  </div>
                )}

                {!isSharing && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>Note:</strong> Enable location sharing to allow travellers to track your bus (Bus {busNumber}) in real-time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Live Map Card - shown when location sharing is active */}
          {hasBusNumber && isSharing && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle>Live Map</CardTitle>
                    <CardDescription>
                      Your current position on the map — updates every 3 seconds
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <BusMap
                  location={driverMapLocation}
                  busNumber={busNumber}
                />
              </CardContent>
            </Card>
          )}

          {/* Status Card - only shown when bus number exists */}
          {hasBusNumber && (
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Your current driver status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Driver Status</span>
                  <Badge variant={isSharing ? 'default' : 'secondary'}>
                    {isSharing ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

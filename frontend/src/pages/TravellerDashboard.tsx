import React, { useState } from 'react';
import { useGetBusLocation, useGetDriver } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BusMap from '../components/BusMap';
import ProximityAlertBanner from '../components/ProximityAlertBanner';
import { useGeolocation } from '../lib/useGeolocation';
import { useProximityAlarm } from '../lib/useProximityAlarm';
import { MapPin, Search, Bus, Clock, Info, RefreshCw, AlertCircle, Navigation } from 'lucide-react';
import { toast } from 'sonner';

interface TravellerDashboardProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function TravellerDashboard({ onNavigate }: TravellerDashboardProps) {
  const [busNumber, setBusNumber] = useState('');
  const [trackingBus, setTrackingBus] = useState<string | null>(null);

  const { data: location, isLoading: locationLoading, error: locationError, refetch } = useGetBusLocation(trackingBus);
  const { data: driver, isLoading: driverLoading, error: driverError } = useGetDriver(trackingBus);

  // Traveller's own device location
  const { coords: travellerCoords, error: geoError, permissionDenied } = useGeolocation();

  // Proximity alarm: bus within 500m of traveller
  const busCoords = location ? { latitude: location.latitude, longitude: location.longitude } : null;
  const { hasTriggered, distance, dismissAlarm } = useProximityAlarm(busCoords, travellerCoords);

  const handleTrackBus = () => {
    if (!busNumber.trim()) {
      toast.error('Please enter a bus number');
      return;
    }
    setTrackingBus(busNumber.trim());
    toast.success(`Tracking bus ${busNumber.trim()}`, {
      description: 'Map will update automatically every 3 seconds',
    });
  };

  const handleStopTracking = () => {
    setTrackingBus(null);
    setBusNumber('');
    dismissAlarm();
    toast.info('Stopped tracking');
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Map refreshed');
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString();
  };

  const formatDistance = (metres: number | null) => {
    if (metres === null) return null;
    if (metres < 1000) return `${Math.round(metres)} m`;
    return `${(metres / 1000).toFixed(2)} km`;
  };

  // Determine the status of the tracked bus
  const getBusStatus = () => {
    if (!trackingBus) return null;

    if (locationError || driverError) {
      return {
        type: 'error' as const,
        message: 'An error occurred while fetching bus information. Please try again.',
      };
    }

    if (locationLoading || driverLoading) {
      return {
        type: 'loading' as const,
        message: 'Loading bus information...',
      };
    }

    if (!driver) {
      return {
        type: 'not-found' as const,
        message: 'Bus not found. Please verify the bus number is correct.',
      };
    }

    if (!driver.isSharingLocation) {
      return {
        type: 'not-sharing' as const,
        message: 'The driver is not currently sharing their location.',
      };
    }

    if (!location) {
      return {
        type: 'no-location' as const,
        message: 'No location data available yet. The driver may have just started sharing.',
      };
    }

    return {
      type: 'active' as const,
      message: 'Bus is sharing its location.',
    };
  };

  const busStatus = getBusStatus();

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

      <Header onNavigate={onNavigate} currentPage="traveller" />

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Traveller Dashboard</h1>
            <p className="text-muted-foreground">Track your bus in real-time with live location updates</p>
          </div>

          {/* Proximity Alert Banner — shown prominently when bus is nearby */}
          {trackingBus && (
            <ProximityAlertBanner
              isVisible={hasTriggered}
              distance={distance}
              onDismiss={dismissAlarm}
            />
          )}

          {/* Geolocation status */}
          {permissionDenied && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-900 dark:text-orange-100">
                <strong>Location Access Denied:</strong> Your device location is unavailable. Proximity alerts are disabled. Please allow location access in your browser settings to enable these features.
              </AlertDescription>
            </Alert>
          )}

          {geoError && !permissionDenied && (
            <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                <strong>Location Unavailable:</strong> {geoError} Proximity alerts are disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Enter a bus number to track its live location on the map. An alarm will sound when the bus is within 500 m of your location. The map updates automatically every 3 seconds.
            </AlertDescription>
          </Alert>

          {/* Search Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Search className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Track a Bus</CardTitle>
                  <CardDescription>Enter a bus number to view its live location on the map</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="bus-search">Bus Number</Label>
                  <Input
                    id="bus-search"
                    placeholder="e.g., BUS-101"
                    value={busNumber}
                    onChange={(e) => setBusNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTrackBus()}
                    disabled={!!trackingBus}
                    className="font-mono"
                  />
                </div>
                <div className="flex items-end">
                  {trackingBus ? (
                    <Button variant="outline" onClick={handleStopTracking}>
                      Stop Tracking
                    </Button>
                  ) : (
                    <Button onClick={handleTrackBus}>
                      <Search className="w-4 h-4 mr-2" />
                      Track Bus
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {trackingBus && busStatus && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="font-mono">Tracking: {trackingBus}</CardTitle>
                      <CardDescription>Live location updates every 3 seconds</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={busStatus.type === 'active' ? 'default' : 'secondary'}>
                      {busStatus.type === 'active'
                        ? 'Active'
                        : busStatus.type === 'loading'
                        ? 'Loading'
                        : 'No Signal'}
                    </Badge>
                    {location && (
                      <Button variant="ghost" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {busStatus.type === 'active' && location ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bus Latitude</p>
                        <p className="font-mono text-sm">{location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bus Longitude</p>
                        <p className="font-mono text-sm">{location.longitude.toFixed(6)}</p>
                      </div>
                      {travellerCoords && (
                        <>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Your Latitude</p>
                            <p className="font-mono text-sm">{travellerCoords.latitude.toFixed(6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Distance to Bus</p>
                            <p className="font-mono text-sm font-semibold text-primary">
                              {formatDistance(distance) ?? '—'}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Last updated: {formatTimestamp(location.timestamp)}
                    </div>
                    {travellerCoords && distance !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Navigation className="w-4 h-4 text-primary" />
                        <span>
                          Bus is{' '}
                          <strong className="text-primary">{formatDistance(distance)}</strong>{' '}
                          from your current location
                          {distance <= 500 && (
                            <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                              ⚠ Nearby!
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        Bus <strong className="font-mono">{trackingBus}</strong> is sharing its location. The map below shows its current position and updates automatically.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : busStatus.type === 'error' ? (
                  <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-900 dark:text-red-100">
                      <strong>Error:</strong> {busStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : busStatus.type === 'not-found' ? (
                  <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                    <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertDescription className="text-orange-900 dark:text-orange-100">
                      <strong>Bus Not Found:</strong> {busStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : busStatus.type === 'not-sharing' ? (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                      <strong>Location Sharing Disabled:</strong> {busStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : busStatus.type === 'no-location' ? (
                  <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                      <strong>No Location Data:</strong> {busStatus.message}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Map Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Live Map</CardTitle>
                  <CardDescription>
                    {trackingBus
                      ? `Showing location for Bus ${trackingBus}`
                      : 'Enter a bus number above to see its location'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BusMap
                location={location ?? null}
                busNumber={trackingBus}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

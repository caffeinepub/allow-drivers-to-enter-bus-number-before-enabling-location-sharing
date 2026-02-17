import React, { useState } from 'react';
import { useGetBusLocation } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BusMap from '../components/BusMap';
import { MapPin, Search, Bus, Clock, Info, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface TravellerDashboardProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function TravellerDashboard({ onNavigate }: TravellerDashboardProps) {
  const [busNumber, setBusNumber] = useState('');
  const [trackingBus, setTrackingBus] = useState<string | null>(null);
  const { data: location, isLoading, refetch } = useGetBusLocation(trackingBus);

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div 
        className="absolute inset-0 opacity-5 dark:opacity-[0.02]"
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
            <p className="text-muted-foreground">Track your bus in real-time</p>
          </div>

          {/* Info Alert */}
          <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              Enter a bus number to track its live location. Only buses with active location sharing will be visible. The map updates automatically every 3 seconds.
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
                  <CardDescription>Enter a bus number to view its live location</CardDescription>
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
          {trackingBus && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <Bus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="font-mono">Tracking: {trackingBus}</CardTitle>
                      <CardDescription>Live location updates</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={location ? 'default' : 'secondary'}>
                      {location ? 'Active' : 'No Signal'}
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
                {location ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Latitude</p>
                        <p className="font-mono text-sm">{location.latitude.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Longitude</p>
                        <p className="font-mono text-sm">{location.longitude.toFixed(6)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Last updated: {formatTimestamp(location.timestamp)}
                    </div>
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-900 dark:text-green-100">
                        Bus <strong className="font-mono">{trackingBus}</strong> is sharing its location. The map below shows its current position and updates automatically.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                      <strong>No location data available.</strong> The bus may not be sharing its location or the bus number may be incorrect. Please verify the bus number with your driver.
                    </p>
                  </div>
                )}
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
                  <CardDescription>Real-time bus location visualization with automatic updates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <BusMap location={location} busNumber={trackingBus} />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}

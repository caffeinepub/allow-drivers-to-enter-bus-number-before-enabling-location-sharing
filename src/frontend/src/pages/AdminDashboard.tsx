import React from 'react';
import { useGetAllDrivers, useGetAllTravellers, useDeactivateUser } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Users, Bus, UserX, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { Driver, User } from '../backend';

interface AdminDashboardProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { data: drivers = [], isLoading: driversLoading } = useGetAllDrivers();
  const { data: travellers = [], isLoading: travellersLoading } = useGetAllTravellers();
  const deactivateUser = useDeactivateUser();

  const handleDeactivate = async (userId: any) => {
    try {
      await deactivateUser.mutateAsync(userId);
      toast.success('User deactivated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to deactivate user');
    }
  };

  const activeDrivers = drivers.filter(d => d.userData.status === 'active').length;
  const activeTravellers = travellers.filter(t => t.status === 'active').length;
  const sharingLocation = drivers.filter(d => d.isSharingLocation).length;

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
      
      <Header onNavigate={onNavigate} currentPage="admin" />

      <main className="flex-1 relative z-10 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage drivers and travellers across the system</p>
        </div>

        {/* Admin Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>System Administrator:</strong> G. Vasu (default admin) is preconfigured and manages this system.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
              <Bus className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDrivers}</div>
              <p className="text-xs text-muted-foreground">
                {sharingLocation} sharing location
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Travellers</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTravellers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drivers.length + travellers.length}</div>
              <p className="text-xs text-muted-foreground">
                System-wide
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="drivers">Drivers ({drivers.length})</TabsTrigger>
            <TabsTrigger value="travellers">Travellers ({travellers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="drivers">
            <Card>
              <CardHeader>
                <CardTitle>Driver Management</CardTitle>
                <CardDescription>View and manage all registered drivers with their bus assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {driversLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : drivers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No drivers registered yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Bus Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Location Sharing</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drivers.map((driver) => (
                          <TableRow key={driver.userData.id.toString()}>
                            <TableCell className="font-medium">{driver.userData.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">{driver.busNumber}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={driver.userData.status === 'active' ? 'default' : 'secondary'}>
                                {driver.userData.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={driver.isSharingLocation ? 'default' : 'secondary'}>
                                {driver.isSharingLocation ? 'Active' : 'Inactive'}
                              </Badge>
                              {driver.isSharingLocation && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Bus {driver.busNumber} visible to travellers
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              {driver.userData.status === 'active' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivate(driver.userData.id)}
                                  disabled={deactivateUser.isPending}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Deactivate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="travellers">
            <Card>
              <CardHeader>
                <CardTitle>Traveller Management</CardTitle>
                <CardDescription>View and manage all registered travellers</CardDescription>
              </CardHeader>
              <CardContent>
                {travellersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : travellers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No travellers registered yet
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {travellers.map((traveller) => (
                          <TableRow key={traveller.id.toString()}>
                            <TableCell className="font-medium">{traveller.name}</TableCell>
                            <TableCell>
                              <Badge variant={traveller.status === 'active' ? 'default' : 'secondary'}>
                                {traveller.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {traveller.status === 'active' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivate(traveller.id)}
                                  disabled={deactivateUser.isPending}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Deactivate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

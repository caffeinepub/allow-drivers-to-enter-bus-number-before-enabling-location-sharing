import React from 'react';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut, Shield, Bus, MapPin } from 'lucide-react';
import { UserRole } from '../backend';

interface HeaderProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
  currentPage?: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { identity, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingOut = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onNavigate('login');
  };

  const getRoleDisplay = () => {
    if (!userProfile) return null;
    
    if (userProfile.role === UserRole.admin) {
      return { icon: Shield, label: 'Admin', page: 'admin' as const };
    } else if (userProfile.busNumber) {
      return { icon: Bus, label: 'Driver', page: 'driver' as const };
    } else {
      return { icon: MapPin, label: 'Traveller', page: 'traveller' as const };
    }
  };

  const roleDisplay = getRoleDisplay();

  return (
    <header className="relative z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bus Tracker
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && userProfile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="w-4 h-4" />
                  {userProfile.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {roleDisplay && (
                  <>
                    <DropdownMenuItem onClick={() => onNavigate(roleDisplay.page)}>
                      <roleDisplay.icon className="w-4 h-4 mr-2" />
                      {roleDisplay.label} Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isAuthenticated ? (
            <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          ) : (
            currentPage !== 'login' && (
              <Button onClick={() => onNavigate('login')}>
                Sign In
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}

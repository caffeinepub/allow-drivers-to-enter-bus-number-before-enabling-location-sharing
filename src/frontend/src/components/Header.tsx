import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Bus, LogOut, UserPlus, LogIn } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onNavigate: (page: 'register' | 'login' | 'admin' | 'driver' | 'traveller') => void;
  currentPage: string;
}

export default function Header({ onNavigate, currentPage }: HeaderProps) {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    onNavigate('login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="relative z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bus className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">College Bus Tracking</span>
        </div>

        <nav className="flex items-center gap-2">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('register')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Register
              </Button>
              <Button size="sm" onClick={() => onNavigate('login')}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </>
          ) : (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {userProfile ? getInitials(userProfile.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {userProfile?.role === 'admin' ? 'Administrator' : userProfile?.busNumber ? 'Driver' : 'Traveller'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    if (userProfile?.role === 'admin') onNavigate('admin');
                    else if (userProfile?.busNumber) onNavigate('driver');
                    else onNavigate('traveller');
                  }}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

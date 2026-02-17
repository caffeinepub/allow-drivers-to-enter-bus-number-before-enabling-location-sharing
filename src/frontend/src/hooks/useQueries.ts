import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Driver, User, Location, RegistrationStatus, LocationUpdateStatus, UserRole } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAdminRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleText: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.adminRegister(roleText);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['allTravellers'] });
    },
  });
}

export function useDriverRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (busNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.driverRegister(busNumber);
      return result;
    },
    onSuccess: (result, busNumber) => {
      // Invalidate profile to get the updated busNumber
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      // Invalidate all drivers list for admin view
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      // Invalidate the specific driver query so dashboard can immediately show driver data
      if (result.__kind__ === 'success') {
        queryClient.invalidateQueries({ queryKey: ['driver', busNumber] });
      }
    },
  });
}

export function useTravellerRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.travellerRegister();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allTravellers'] });
    },
  });
}

export function useGetAllDrivers() {
  const { actor, isFetching } = useActor();

  return useQuery<Driver[]>({
    queryKey: ['allDrivers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllDrivers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllTravellers() {
  const { actor, isFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['allTravellers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTravellers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDriver(busNumber: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Driver | null>({
    queryKey: ['driver', busNumber],
    queryFn: async () => {
      if (!actor || !busNumber) return null;
      return actor.getDriver(busNumber);
    },
    enabled: !!actor && !isFetching && !!busNumber,
    refetchInterval: 3000,
  });
}

export function useToggleLocationSharing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (busNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleLocationSharing(busNumber);
    },
    onSuccess: (_, busNumber) => {
      queryClient.invalidateQueries({ queryKey: ['driver', busNumber] });
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['busLocation', busNumber] });
    },
  });
}

export function useUpdateLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ busNumber, location }: { busNumber: string; location: Location }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateLocation(busNumber, location);
    },
    onSuccess: (_, { busNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['driver', busNumber] });
      queryClient.invalidateQueries({ queryKey: ['busLocation', busNumber] });
    },
  });
}

export function useGetBusLocation(busNumber: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Location | null>({
    queryKey: ['busLocation', busNumber],
    queryFn: async () => {
      if (!actor || !busNumber) return null;
      return actor.getBusLocation(busNumber);
    },
    enabled: !!actor && !isFetching && !!busNumber,
    refetchInterval: 3000,
  });
}

export function useDeactivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deactivateUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['allTravellers'] });
    },
  });
}

export function useActivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.activateUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['allTravellers'] });
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

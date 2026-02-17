import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Driver, User, Location, RegistrationStatus, LocationUpdateStatus, UserRole } from '../backend';
import { Principal } from '@dfinity/principal';
import { normalizeBackendError } from '../utils/backendErrors';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error: any) {
        // Handle authorization errors gracefully - user might not be registered yet
        if (error.message && error.message.includes('Unauthorized')) {
          return null;
        }
        throw error;
      }
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
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAdminRegister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<RegistrationStatus, Error, string>({
    mutationFn: async (roleText: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.adminRegister(roleText);
        return result;
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
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

  return useMutation<RegistrationStatus, Error, string>({
    mutationFn: async (busNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.driverRegister(busNumber);
        return result;
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
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

  return useMutation<RegistrationStatus, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const result = await actor.travellerRegister();
        return result;
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
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
      try {
        return await actor.getAllDrivers();
      } catch (error: any) {
        if (error.message && error.message.includes('Unauthorized')) {
          console.error('Authorization error fetching drivers:', error);
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useGetAllTravellers() {
  const { actor, isFetching } = useActor();

  return useQuery<User[]>({
    queryKey: ['allTravellers'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllTravellers();
      } catch (error: any) {
        if (error.message && error.message.includes('Unauthorized')) {
          console.error('Authorization error fetching travellers:', error);
          return [];
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
  });
}

export function useGetDriver(busNumber: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Driver | null>({
    queryKey: ['driver', busNumber],
    queryFn: async () => {
      if (!actor || !busNumber) return null;
      try {
        return await actor.getDriver(busNumber);
      } catch (error: any) {
        if (error.message && error.message.includes('Unauthorized')) {
          console.error('Authorization error fetching driver:', error);
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!busNumber,
    retry: 1,
  });
}

export function useUpdateLocation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ busNumber, location }: { busNumber: string; location: Location }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.updateLocation(busNumber, location);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: (_, { busNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['driver', busNumber] });
      queryClient.invalidateQueries({ queryKey: ['busLocation', busNumber] });
    },
  });
}

export function useToggleLocationSharing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (busNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.toggleLocationSharing(busNumber);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: (_, busNumber) => {
      queryClient.invalidateQueries({ queryKey: ['driver', busNumber] });
    },
  });
}

export function useGetBusLocation(busNumber: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Location | null>({
    queryKey: ['busLocation', busNumber],
    queryFn: async () => {
      if (!actor || !busNumber) return null;
      try {
        return await actor.getBusLocation(busNumber);
      } catch (error: any) {
        // Handle authorization errors gracefully
        if (error.message && error.message.includes('Unauthorized')) {
          console.error('Authorization error fetching bus location:', error);
          return null;
        }
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!busNumber,
    refetchInterval: 3000,
    retry: 1,
  });
}

export function useDeactivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.deactivateUser(user);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
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
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.activateUser(user);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDrivers'] });
      queryClient.invalidateQueries({ queryKey: ['allTravellers'] });
    },
  });
}

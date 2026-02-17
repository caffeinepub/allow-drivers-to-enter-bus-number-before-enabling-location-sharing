import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Location {
    latitude: number;
    longitude: number;
    timestamp: Time;
}
export type RegistrationStatus = {
    __kind__: "failure";
    failure: string;
} | {
    __kind__: "success";
    success: null;
};
export type Time = bigint;
export interface Driver {
    userData: User;
    isSharingLocation: boolean;
    busNumber: string;
    currentLocation?: Location;
}
export interface User {
    id: Principal;
    status: UserStatus;
    name: string;
    role: UserRole;
}
export interface UserProfile {
    name: string;
    role: UserRole;
    busNumber?: string;
}
export enum LocationUpdateStatus {
    inactive = "inactive",
    notFound = "notFound",
    success = "success"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum UserStatus {
    active = "active",
    inactive = "inactive"
}
export interface backendInterface {
    activateUser(user: Principal): Promise<void>;
    adminRegister(roleText: string): Promise<RegistrationStatus>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deactivateUser(user: Principal): Promise<void>;
    driverRegister(busNumber: string): Promise<RegistrationStatus>;
    getAllDrivers(): Promise<Array<Driver>>;
    getAllTravellers(): Promise<Array<User>>;
    getBusLocation(busNumber: string): Promise<Location | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDriver(busNumber: string): Promise<Driver | null>;
    getLocation(busNumber: string): Promise<Location | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleLocationSharing(busNumber: string): Promise<boolean>;
    travellerRegister(): Promise<RegistrationStatus>;
    updateLocation(busNumber: string, location: Location): Promise<LocationUpdateStatus>;
}

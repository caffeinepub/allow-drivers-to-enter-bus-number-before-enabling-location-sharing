import Map "mo:core/Map";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = AccessControl.UserRole;
  public type UserStatus = { #active; #inactive };
  public type RegistrationStatus = {
    #success;
    #failure : Text;
  };
  public type LocationUpdateStatus = { #success; #notFound; #inactive };

  public type User = {
    id : Principal;
    name : Text;
    role : UserRole;
    status : UserStatus;
  };

  public type Driver = {
    userData : User;
    busNumber : Text;
    isSharingLocation : Bool;
    currentLocation : ?Location;
  };

  public type Location = {
    latitude : Float;
    longitude : Float;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    role : UserRole;
    busNumber : ?Text;
  };

  public type AdminRole = { #admin; #driver; #traveller };

  module AdminRole {
    public func fromText(text : Text) : ?AdminRole {
      switch (text) {
        case ("admin") { ?#admin };
        case ("driver") { ?#driver };
        case ("traveller") { ?#traveller };
        case (_) { null };
      };
    };
  };

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.name, user2.name);
    };
    public func compareById(user1 : User, user2 : User) : Order.Order {
      Principal.compare(user1.id, user2.id);
    };
  };

  module Driver {
    public func compare(driver1 : Driver, driver2 : Driver) : Order.Order {
      Text.compare(driver1.userData.name, driver2.userData.name);
    };
    public func compareByBusNumber(driver1 : Driver, driver2 : Driver) : Order.Order {
      switch (Text.compare(driver1.busNumber, driver2.busNumber)) {
        case (#equal) { Text.compare(driver1.userData.name, driver2.userData.name) };
        case (order) { order };
      };
    };
  };

  let drivers = Map.empty<Text, Driver>();
  let travellers = Map.empty<Principal, User>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  private func isRegisteredUser(principal : Principal) : Bool {
    if (principal.isAnonymous()) {
      return false;
    };
    switch (userProfiles.get(principal)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  private func requireRegisteredUser(caller : Principal) {
    if (not isRegisteredUser(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
    };
  };

  private func requireNonAnonymous(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Anonymous principals cannot perform this action");
    };
  };

  private func isAdminRegistered() : Bool {
    var found = false;
    let iter = userProfiles.values();
    while (not found) {
      switch (iter.next()) {
        case (null) { return found };
        case (?profile) {
          if (profile.role == #admin) {
            found := true;
          };
        };
      };
    };
    found;
  };

  // adminRegister handles self-registration for admin (first admin or existing admin) and traveller roles.
  // Driver registration must go through driverRegister (requires bus number).
  // - admin: first admin can self-register; subsequent admins require an existing admin caller.
  // - traveller: any non-anonymous, unregistered user can self-register.
  // - driver: redirected to driverRegister (no admin check needed here).
  public shared ({ caller }) func adminRegister(roleText : Text, name : Text) : async RegistrationStatus {
    requireNonAnonymous(caller);
    let roleOpt = AdminRole.fromText(roleText);
    switch (roleOpt) {
      case (null) { return #failure("Invalid role specified. Please try again.") };
      case (?role) {
        switch (role) {
          case (#admin) {
            if (isRegisteredUser(caller)) {
              return #failure("User already registered");
            };
            // If an admin already exists, only an existing admin can register another admin
            if (isAdminRegistered()) {
              if (not AccessControl.isAdmin(accessControlState, caller)) {
                return #failure("Unauthorized: Only admins can register another admin. Please contact the system administrator.");
              };
            };
            let profile : UserProfile = {
              name;
              role = #admin;
              busNumber = null;
            };
            userProfiles.add(caller, profile);
            #success;
          };
          case (#driver) {
            // Driver registration requires a bus number; direct users to driverRegister
            return #failure("Driver registration requires a valid bus number. Please use the driver registration process.");
          };
          case (#traveller) {
            // Any non-anonymous user can self-register as a traveller
            if (isRegisteredUser(caller)) {
              return #failure("User already registered");
            };

            let traveller = {
              id = caller;
              name;
              role = #user;
              status = #active;
            };
            travellers.add(caller, traveller);

            let profile : UserProfile = {
              name;
              role = #user;
              busNumber = null;
            };
            userProfiles.add(caller, profile);
            #success;
          };
        };
      };
    };
  };

  // driverRegister: any non-anonymous, unregistered user can self-register as a driver with a bus number.
  public shared ({ caller }) func driverRegister(name : Text, busNumber : Text) : async RegistrationStatus {
    requireNonAnonymous(caller);

    if (not Text.equal(busNumber, busNumber.trim(#char(' ')))) {
      return #failure("Bus number cannot contain spaces, please try again");
    };
    if (busNumber.chars().size() < 6 or busNumber.chars().size() > 9) {
      return #failure("Bus number must contain at least 6 characters and at most 9. Please try again.");
    };

    if (isRegisteredUser(caller)) { return #failure("User already registered") };
    switch (drivers.get(busNumber)) {
      case (?_) { return #failure("Bus number already registered") };
      case null {};
    };

    let driver = {
      userData = {
        id = caller;
        name;
        role = #user;
        status = #active;
      };
      busNumber;
      isSharingLocation = false;
      currentLocation = null;
    };

    drivers.add(busNumber, driver);

    let profile : UserProfile = {
      name;
      role = #user;
      busNumber = ?busNumber;
    };
    userProfiles.add(caller, profile);

    #success;
  };

  // travellerRegister: any non-anonymous, unregistered user can self-register as a traveller.
  public shared ({ caller }) func travellerRegister(name : Text) : async RegistrationStatus {
    requireNonAnonymous(caller);

    if (isRegisteredUser(caller)) {
      return #failure("User already registered");
    };

    let traveller = {
      id = caller;
      name;
      role = #user;
      status = #active;
    };

    travellers.add(caller, traveller);

    let profile : UserProfile = {
      name;
      role = #user;
      busNumber = null;
    };
    userProfiles.add(caller, profile);

    #success;
  };

  // getCallerUserProfile: any caller (including anonymous) can query their own profile.
  // Anonymous callers will simply get null.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  // getUserProfile: a user can view their own profile; admins can view any profile.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // saveCallerUserProfile: only registered (non-anonymous, enrolled) users can update their profile.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireRegisteredUser(caller);
    userProfiles.add(caller, profile);
  };

  // getAllDrivers: admin-only.
  public query ({ caller }) func getAllDrivers() : async [Driver] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    drivers.values().toArray().sort();
  };

  // getAllTravellers: admin-only.
  public query ({ caller }) func getAllTravellers() : async [User] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    travellers.values().toArray().sort();
  };

  // getDriver: registered users only.
  public query ({ caller }) func getDriver(busNumber : Text) : async ?Driver {
    requireRegisteredUser(caller);
    drivers.get(busNumber);
  };

  // updateLocation: registered users only; ownership enforced inside.
  public shared ({ caller }) func updateLocation(busNumber : Text, location : Location) : async LocationUpdateStatus {
    requireRegisteredUser(caller);

    let driverOpt = drivers.get(busNumber);
    switch (driverOpt) {
      case (null) { #notFound };
      case (?driver) {
        if (driver.userData.id != caller) {
          Runtime.trap("Unauthorized: Can only update your own location");
        };
        if (not driver.isSharingLocation) { return #inactive };
        let updatedDriver : Driver = {
          userData = driver.userData;
          busNumber = driver.busNumber;
          isSharingLocation = driver.isSharingLocation;
          currentLocation = ?location;
        };
        drivers.add(busNumber, updatedDriver);
        #success;
      };
    };
  };

  // toggleLocationSharing: registered users only; ownership enforced inside.
  public shared ({ caller }) func toggleLocationSharing(busNumber : Text) : async Bool {
    requireRegisteredUser(caller);

    let driverOpt = drivers.get(busNumber);
    switch (driverOpt) {
      case (null) { false };
      case (?driver) {
        if (driver.userData.id != caller) {
          Runtime.trap("Unauthorized: Can only toggle your own location sharing");
        };
        let updatedDriver : Driver = {
          userData = driver.userData;
          busNumber = driver.busNumber;
          isSharingLocation = not driver.isSharingLocation;
          currentLocation = driver.currentLocation;
        };
        drivers.add(busNumber, updatedDriver);
        updatedDriver.isSharingLocation;
      };
    };
  };

  // getLocation: registered users only.
  public query ({ caller }) func getLocation(busNumber : Text) : async ?Location {
    requireRegisteredUser(caller);
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };

  // deactivateUser: admin-only.
  public shared ({ caller }) func deactivateUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (travellers.get(user)) {
      case (?traveller) {
        travellers.add(user, {
          id = traveller.id;
          name = traveller.name;
          role = traveller.role;
          status = #inactive;
        });
      };
      case null {};
    };

    for ((busNumber, driver) in drivers.entries()) {
      if (driver.userData.id == user) {
        drivers.add(busNumber, {
          userData = {
            id = driver.userData.id;
            name = driver.userData.name;
            role = driver.userData.role;
            status = #inactive;
          };
          busNumber = driver.busNumber;
          isSharingLocation = driver.isSharingLocation;
          currentLocation = driver.currentLocation;
        });
      };
    };
  };

  // activateUser: admin-only.
  public shared ({ caller }) func activateUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };

    switch (travellers.get(user)) {
      case (?traveller) {
        travellers.add(user, {
          id = traveller.id;
          name = traveller.name;
          role = traveller.role;
          status = #active;
        });
      };
      case null {};
    };

    for ((busNumber, driver) in drivers.entries()) {
      if (driver.userData.id == user) {
        drivers.add(busNumber, {
          userData = {
            id = driver.userData.id;
            name = driver.userData.name;
            role = driver.userData.role;
            status = #active;
          };
          busNumber = driver.busNumber;
          isSharingLocation = driver.isSharingLocation;
          currentLocation = driver.currentLocation;
        });
      };
    };
  };

  // getBusLocation: registered users only.
  public query ({ caller }) func getBusLocation(busNumber : Text) : async ?Location {
    requireRegisteredUser(caller);
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };
};

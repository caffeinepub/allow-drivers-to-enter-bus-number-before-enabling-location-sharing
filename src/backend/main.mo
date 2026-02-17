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
  public type RegistrationStatus = { #success; #failure : Text };
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

  // Helper function to check if caller is registered user or admin
  private func requireRegisteredUser(caller : Principal) {
    if (not isRegisteredUser(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only registered users can perform this action");
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

  public shared ({ caller }) func adminRegister(roleText : Text) : async RegistrationStatus {
    let roleOpt = AdminRole.fromText(roleText);
    switch (roleOpt) {
      case (null) { return #failure("Invalid role specified. Please try again.") };
      case (?role) {
        switch (role) {
          case (#admin) {
            if (isRegisteredUser(caller)) {
              return #failure("User already registered");
            };
            if (isAdminRegistered()) {
              if (not AccessControl.isAdmin(accessControlState, caller)) {
                return #failure("Unauthorized: Only admins can register another admin. Please contact the system administrator.");
              };
            };
            let profile : UserProfile = {
              name = "Admin";
              role = #admin;
              busNumber = null;
            };
            userProfiles.add(caller, profile);
            #success;
          };
          case (#driver) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              return #failure("Unauthorized: Only admins can register a driver. Please contact the system administrator.");
            };
            #failure("Driver registration requires a valid bus number. Please use the driver registration process.");
          };
          case (#traveller) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              return #failure("Unauthorized: Only admins can register a traveller. Please contact the system administrator.");
            };
            if (isRegisteredUser(caller)) { return #failure("User already registered") };

            let profile : UserProfile = {
              name = "Traveller";
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

  public shared ({ caller }) func driverRegister(busNumber : Text) : async RegistrationStatus {
    // Allow self-registration for drivers
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
        name = "Driver";
        role = #user;
        status = #active;
      };
      busNumber;
      isSharingLocation = false;
      currentLocation = null;
    };

    drivers.add(busNumber, driver);

    let profile : UserProfile = {
      name = "Driver";
      role = #user;
      busNumber = ?busNumber;
    };
    userProfiles.add(caller, profile);

    #success;
  };

  public shared ({ caller }) func travellerRegister() : async RegistrationStatus {
    // Allow self-registration for travellers
    if (isRegisteredUser(caller)) {
      return #failure("User already registered");
    };

    let traveller = {
      id = caller;
      name = "Traveller";
      role = #user;
      status = #active;
    };

    travellers.add(caller, traveller);

    let profile : UserProfile = {
      name = "Traveller";
      role = #user;
      busNumber = null;
    };
    userProfiles.add(caller, profile);

    #success;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireRegisteredUser(caller);
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllDrivers() : async [Driver] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    drivers.values().toArray().sort();
  };

  public query ({ caller }) func getAllTravellers() : async [User] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    travellers.values().toArray().sort();
  };

  public query ({ caller }) func getDriver(busNumber : Text) : async ?Driver {
    requireRegisteredUser(caller);
    drivers.get(busNumber);
  };

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

  public query ({ caller }) func getLocation(busNumber : Text) : async ?Location {
    requireRegisteredUser(caller);
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };

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

  public query ({ caller }) func getBusLocation(busNumber : Text) : async ?Location {
    requireRegisteredUser(caller);
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };
};

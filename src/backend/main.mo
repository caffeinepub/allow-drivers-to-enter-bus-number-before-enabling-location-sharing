import Map "mo:core/Map";
import Array "mo:core/Array";
import Cargo "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import Text "mo:core/Text";

import Debug "mo:core/Debug";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

// Attach migration logic to actor with-clause

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserRole = AccessControl.UserRole;

  public type UserStatus = {
    #active;
    #inactive;
  };

  public type RegistrationStatus = {
    #success;
    #failure : Text;
  };

  public type LocationUpdateStatus = {
    #success;
    #notFound;
    #inactive;
  };

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

  public type AdminRole = {
    #admin;
    #driver;
    #traveller;
  };

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

  public shared ({ caller }) func adminRegister(roleText : Text) : async RegistrationStatus {
    let roleOpt = AdminRole.fromText(roleText);
    switch (roleOpt) {
      case (null) { return #failure("Invalid role specified. Please try again.") };
      case (?role) {
        switch (role) {
          case (#admin) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only admins can register another admin");
            };
            switch (userProfiles.get(caller)) {
              case (?_) { return #failure("User already registered") };
              case null {};
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
              Runtime.trap("Unauthorized: Only admins can register a driver");
            };
            #failure("Driver registration requires a valid bus number. Please use the driver registration process.");
          };
          case (#traveller) {
            if (not AccessControl.isAdmin(accessControlState, caller)) {
              Runtime.trap("Unauthorized: Only admins can register a traveller");
            };
            switch (userProfiles.get(caller)) {
              case (?_) { return #failure("User already registered") };
              case null {};
            };
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
    // Allow guests to register as drivers (self-registration)
    // This is intentional for the application flow where new users can sign up
    
    if (not Text.equal(busNumber, busNumber.trim(#char(' ')))) {
      return #failure("Bus number cannot contain spaces, please try again");
    };
    if (busNumber.chars().size() < 6 or busNumber.chars().size() > 9) {
      return #failure("Bus number must contain at least 6 characters and at most 9. Please try again.");
    };

    switch (userProfiles.get(caller)) {
      case (?_) { return #failure("User already registered") };
      case null {};
    };

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
    // Allow guests to register as travellers (self-registration)
    // This is intentional for the application flow where new users can sign up
    
    switch (userProfiles.get(caller)) {
      case (?_) { return #failure("User already registered") };
      case null {};
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
    // No authorization check needed - users can view their own profile
    // Returns null for guests/unregistered users
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    switch (userProfiles.get(caller)) {
      case null { Runtime.trap("Unauthorized: User not registered") };
      case (?_) {};
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getAllDrivers() : async [Driver] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all drivers");
    };
    drivers.values().toArray().sort();
  };

  public query ({ caller }) func getAllTravellers() : async [User] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all travellers");
    };
    travellers.values().toArray().sort();
  };

  public query ({ caller }) func getDriver(busNumber : Text) : async ?Driver {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view driver information");
    };
    drivers.get(busNumber);
  };

  public shared ({ caller }) func updateLocation(busNumber : Text, location : Location) : async LocationUpdateStatus {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can update location");
    };

    let driverOpt = drivers.get(busNumber);
    switch (driverOpt) {
      case (null) { #notFound };
      case (?driver) {
        if (driver.userData.id != caller) {
          Runtime.trap("Unauthorized: Can only update your own bus location");
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can toggle location sharing");
    };

    let driverOpt = drivers.get(busNumber);
    switch (driverOpt) {
      case (null) { false };
      case (?driver) {
        if (driver.userData.id != caller) {
          Runtime.trap("Unauthorized: Can only toggle location sharing for your own bus");
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view bus locations");
    };
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };

  public shared ({ caller }) func deactivateUser(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can deactivate users");
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
      Runtime.trap("Unauthorized: Only admins can activate users");
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
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can view bus locations");
    };
    switch (drivers.get(busNumber)) {
      case (null) { null };
      case (?driver) { driver.currentLocation };
    };
  };
};

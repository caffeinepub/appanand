import Array "mo:base/Array";
import Float "mo:base/Float";
import Order "mo:base/Order";
import Time "mo:base/Time";
import BlobStorageMixin "blob-storage/Mixin";

persistent actor {
  // ---- Blob Storage (mixin) ----
  include BlobStorageMixin();

  // ---- Users ----
  public type User = {
    id : Nat;
    name : Text;
    username : Text;
    password : Text;
    createdAt : Int;
  };

  stable var users : [User] = [];
  stable var nextUserId : Nat = 1;

  public func registerUser(name : Text, username : Text, password : Text) : async ?User {
    if (users.size() >= 10) { return null };
    let exists = Array.find(users, func(u : User) : Bool { u.username == username });
    switch (exists) {
      case (?_) { null };
      case null {
        let id = nextUserId;
        nextUserId += 1;
        let user : User = { id; name; username; password; createdAt = Time.now() };
        users := Array.append(users, [user]);
        ?user
      };
    };
  };

  public query func loginUser(username : Text, password : Text) : async ?User {
    Array.find(users, func(u : User) : Bool {
      u.username == username and u.password == password
    })
  };

  public query func getUserCount() : async Nat {
    users.size()
  };

  // ---- Migration: legacy DutyEntry type (without reportingTime) ----
  type DutyEntryLegacy = {
    id : Nat;
    dutyDate : Int;
    workType : Text;
    dutyRole : Text;
    orderNo : Text;
    remunerationAmount : Float;
    remunerationCredited : Bool;
    remunerationCreditDate : ?Int;
    taEligible : Bool;
    taAmount : ?Float;
    taSubmissionStatus : ?Text;
    taCredited : ?Bool;
    taCreditDate : ?Int;
    orderDocumentId : ?Text;
    remarks : ?Text;
    createdAt : Int;
  };

  // V2 type (with reportingTime, no userId)
  type DutyEntryV2 = {
    id : Nat;
    dutyDate : Int;
    reportingTime : ?Text;
    workType : Text;
    dutyRole : Text;
    orderNo : Text;
    remunerationAmount : Float;
    remunerationCredited : Bool;
    remunerationCreditDate : ?Int;
    taEligible : Bool;
    taAmount : ?Float;
    taSubmissionStatus : ?Text;
    taCredited : ?Bool;
    taCreditDate : ?Int;
    orderDocumentId : ?Text;
    remarks : ?Text;
    createdAt : Int;
  };

  // ---- Duty Entries (Module 1) ----
  public type DutyEntry = {
    id : Nat;
    userId : Nat;
    dutyDate : Int;
    reportingTime : ?Text;
    workType : Text;
    dutyRole : Text;
    orderNo : Text;
    remunerationAmount : Float;
    remunerationCredited : Bool;
    remunerationCreditDate : ?Int;
    taEligible : Bool;
    taAmount : ?Float;
    taSubmissionStatus : ?Text;
    taCredited : ?Bool;
    taCreditDate : ?Int;
    orderDocumentId : ?Text;
    remarks : ?Text;
    createdAt : Int;
  };

  public type DutyEntryInput = {
    userId : Nat;
    dutyDate : Int;
    reportingTime : ?Text;
    workType : Text;
    dutyRole : Text;
    orderNo : Text;
    remunerationAmount : Float;
    remunerationCredited : Bool;
    remunerationCreditDate : ?Int;
    taEligible : Bool;
    taAmount : ?Float;
    taSubmissionStatus : ?Text;
    taCredited : ?Bool;
    taCreditDate : ?Int;
    orderDocumentId : ?Text;
    remarks : ?Text;
  };

  // Legacy stable vars (kept for migration)
  stable var entries : [DutyEntryLegacy] = [];
  stable var entriesV2 : [DutyEntryV2] = [];
  stable var entriesMigrated : Bool = false;
  // New stable var with userId
  stable var entriesV3 : [DutyEntry] = [];
  stable var entriesV3Migrated : Bool = false;

  stable var nextId : Nat = 1;

  system func postupgrade() {
    // Migrate legacy -> V2
    if (not entriesMigrated) {
      entriesV2 := Array.map(
        entries,
        func(e : DutyEntryLegacy) : DutyEntryV2 {
          {
            id = e.id;
            dutyDate = e.dutyDate;
            reportingTime = null;
            workType = e.workType;
            dutyRole = e.dutyRole;
            orderNo = e.orderNo;
            remunerationAmount = e.remunerationAmount;
            remunerationCredited = e.remunerationCredited;
            remunerationCreditDate = e.remunerationCreditDate;
            taEligible = e.taEligible;
            taAmount = e.taAmount;
            taSubmissionStatus = e.taSubmissionStatus;
            taCredited = e.taCredited;
            taCreditDate = e.taCreditDate;
            orderDocumentId = e.orderDocumentId;
            remarks = e.remarks;
            createdAt = e.createdAt;
          }
        },
      );
      entries := [];
      entriesMigrated := true;
    };
    // Migrate V2 -> V3 (add userId = 1 for existing records)
    if (not entriesV3Migrated) {
      entriesV3 := Array.map(
        entriesV2,
        func(e : DutyEntryV2) : DutyEntry {
          {
            id = e.id;
            userId = 1;
            dutyDate = e.dutyDate;
            reportingTime = e.reportingTime;
            workType = e.workType;
            dutyRole = e.dutyRole;
            orderNo = e.orderNo;
            remunerationAmount = e.remunerationAmount;
            remunerationCredited = e.remunerationCredited;
            remunerationCreditDate = e.remunerationCreditDate;
            taEligible = e.taEligible;
            taAmount = e.taAmount;
            taSubmissionStatus = e.taSubmissionStatus;
            taCredited = e.taCredited;
            taCreditDate = e.taCreditDate;
            orderDocumentId = e.orderDocumentId;
            remarks = e.remarks;
            createdAt = e.createdAt;
          }
        },
      );
      entriesV2 := [];
      entriesV3Migrated := true;
    };
  };

  public func addDutyEntry(input : DutyEntryInput) : async Nat {
    let id = nextId;
    nextId += 1;
    let entry : DutyEntry = {
      id;
      userId = input.userId;
      dutyDate = input.dutyDate;
      reportingTime = input.reportingTime;
      workType = input.workType;
      dutyRole = input.dutyRole;
      orderNo = input.orderNo;
      remunerationAmount = input.remunerationAmount;
      remunerationCredited = input.remunerationCredited;
      remunerationCreditDate = input.remunerationCreditDate;
      taEligible = input.taEligible;
      taAmount = input.taAmount;
      taSubmissionStatus = input.taSubmissionStatus;
      taCredited = input.taCredited;
      taCreditDate = input.taCreditDate;
      orderDocumentId = input.orderDocumentId;
      remarks = input.remarks;
      createdAt = Time.now();
    };
    entriesV3 := Array.append(entriesV3, [entry]);
    id
  };

  public query func getAllDutyEntries() : async [DutyEntry] {
    Array.sort(
      entriesV3,
      func(a : DutyEntry, b : DutyEntry) : Order.Order {
        if (a.dutyDate > b.dutyDate) { #less }
        else if (a.dutyDate < b.dutyDate) { #greater }
        else { #equal }
      },
    )
  };

  public query func getDutyEntriesByUser(userId : Nat) : async [DutyEntry] {
    let filtered = Array.filter(entriesV3, func(e : DutyEntry) : Bool { e.userId == userId });
    Array.sort(
      filtered,
      func(a : DutyEntry, b : DutyEntry) : Order.Order {
        if (a.dutyDate > b.dutyDate) { #less }
        else if (a.dutyDate < b.dutyDate) { #greater }
        else { #equal }
      },
    )
  };

  public query func getDutyEntry(id : Nat) : async ?DutyEntry {
    Array.find(entriesV3, func(e : DutyEntry) : Bool { e.id == id })
  };

  public func updateDutyEntry(id : Nat, input : DutyEntryInput) : async Bool {
    var found = false;
    entriesV3 := Array.map(
      entriesV3,
      func(e : DutyEntry) : DutyEntry {
        if (e.id == id) {
          found := true;
          {
            id = e.id;
            userId = input.userId;
            dutyDate = input.dutyDate;
            reportingTime = input.reportingTime;
            workType = input.workType;
            dutyRole = input.dutyRole;
            orderNo = input.orderNo;
            remunerationAmount = input.remunerationAmount;
            remunerationCredited = input.remunerationCredited;
            remunerationCreditDate = input.remunerationCreditDate;
            taEligible = input.taEligible;
            taAmount = input.taAmount;
            taSubmissionStatus = input.taSubmissionStatus;
            taCredited = input.taCredited;
            taCreditDate = input.taCreditDate;
            orderDocumentId = input.orderDocumentId;
            remarks = input.remarks;
            createdAt = e.createdAt;
          }
        } else { e }
      },
    );
    found
  };

  public func deleteDutyEntry(id : Nat) : async Bool {
    let before = entriesV3.size();
    entriesV3 := Array.filter(entriesV3, func(e : DutyEntry) : Bool { e.id != id });
    entriesV3.size() < before
  };

  // ---- Leave Entries (Module 2: Comp Off & Unpunched OD) ----
  type LeaveEntryLegacy = {
    id : Nat;
    leaveType : Text;
    holidayDutyDate : ?Int;
    sanctionedDate : ?Int;
    sanctionedOD : ?Nat;
    orderDocumentLeaveId : ?Text;
    orderNumber : Text;
    availed : Bool;
    availedDates : [Int];
    remarks : ?Text;
    createdAt : Int;
  };

  public type LeaveEntry = {
    id : Nat;
    userId : Nat;
    leaveType : Text;
    holidayDutyDate : ?Int;
    sanctionedDate : ?Int;
    sanctionedOD : ?Nat;
    orderDocumentLeaveId : ?Text;
    orderNumber : Text;
    availed : Bool;
    availedDates : [Int];
    remarks : ?Text;
    createdAt : Int;
  };

  public type LeaveEntryInput = {
    userId : Nat;
    leaveType : Text;
    holidayDutyDate : ?Int;
    sanctionedDate : ?Int;
    sanctionedOD : ?Nat;
    orderDocumentLeaveId : ?Text;
    orderNumber : Text;
    availed : Bool;
    availedDates : [Int];
    remarks : ?Text;
  };

  stable var nextLeaveId : Nat = 1;
  stable var leaveEntries : [LeaveEntryLegacy] = [];
  stable var leaveEntriesV2 : [LeaveEntry] = [];
  stable var leaveEntriesMigrated : Bool = false;

  system func preupgrade() {};

  // Called inline after postupgrade
  // We do leave migration in postupgrade as well
  // (Motoko only allows one postupgrade, so we add it there)

  public func addLeaveEntry(input : LeaveEntryInput) : async Nat {
    // Migrate legacy leave entries on first write if not done yet
    if (not leaveEntriesMigrated) {
      leaveEntriesV2 := Array.map(
        leaveEntries,
        func(e : LeaveEntryLegacy) : LeaveEntry {
          {
            id = e.id;
            userId = 1;
            leaveType = e.leaveType;
            holidayDutyDate = e.holidayDutyDate;
            sanctionedDate = e.sanctionedDate;
            sanctionedOD = e.sanctionedOD;
            orderDocumentLeaveId = e.orderDocumentLeaveId;
            orderNumber = e.orderNumber;
            availed = e.availed;
            availedDates = e.availedDates;
            remarks = e.remarks;
            createdAt = e.createdAt;
          }
        },
      );
      leaveEntries := [];
      leaveEntriesMigrated := true;
    };
    let id = nextLeaveId;
    nextLeaveId += 1;
    let entry : LeaveEntry = {
      id;
      userId = input.userId;
      leaveType = input.leaveType;
      holidayDutyDate = input.holidayDutyDate;
      sanctionedDate = input.sanctionedDate;
      sanctionedOD = input.sanctionedOD;
      orderDocumentLeaveId = input.orderDocumentLeaveId;
      orderNumber = input.orderNumber;
      availed = input.availed;
      availedDates = input.availedDates;
      remarks = input.remarks;
      createdAt = Time.now();
    };
    leaveEntriesV2 := Array.append(leaveEntriesV2, [entry]);
    id
  };

  public query func getAllLeaveEntries() : async [LeaveEntry] {
    let src = if (leaveEntriesMigrated) { leaveEntriesV2 } else {
      Array.map(leaveEntries, func(e : LeaveEntryLegacy) : LeaveEntry {
        { id = e.id; userId = 1; leaveType = e.leaveType; holidayDutyDate = e.holidayDutyDate;
          sanctionedDate = e.sanctionedDate; sanctionedOD = e.sanctionedOD;
          orderDocumentLeaveId = e.orderDocumentLeaveId; orderNumber = e.orderNumber;
          availed = e.availed; availedDates = e.availedDates; remarks = e.remarks; createdAt = e.createdAt; }
      })
    };
    Array.sort(
      src,
      func(a : LeaveEntry, b : LeaveEntry) : Order.Order {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal }
      },
    )
  };

  public query func getLeaveEntriesByUser(userId : Nat) : async [LeaveEntry] {
    let src = if (leaveEntriesMigrated) { leaveEntriesV2 } else {
      Array.map(leaveEntries, func(e : LeaveEntryLegacy) : LeaveEntry {
        { id = e.id; userId = 1; leaveType = e.leaveType; holidayDutyDate = e.holidayDutyDate;
          sanctionedDate = e.sanctionedDate; sanctionedOD = e.sanctionedOD;
          orderDocumentLeaveId = e.orderDocumentLeaveId; orderNumber = e.orderNumber;
          availed = e.availed; availedDates = e.availedDates; remarks = e.remarks; createdAt = e.createdAt; }
      })
    };
    let filtered = Array.filter(src, func(e : LeaveEntry) : Bool { e.userId == userId });
    Array.sort(
      filtered,
      func(a : LeaveEntry, b : LeaveEntry) : Order.Order {
        if (a.createdAt > b.createdAt) { #less }
        else if (a.createdAt < b.createdAt) { #greater }
        else { #equal }
      },
    )
  };

  public query func getLeaveEntry(id : Nat) : async ?LeaveEntry {
    let src = if (leaveEntriesMigrated) { leaveEntriesV2 } else {
      Array.map(leaveEntries, func(e : LeaveEntryLegacy) : LeaveEntry {
        { id = e.id; userId = 1; leaveType = e.leaveType; holidayDutyDate = e.holidayDutyDate;
          sanctionedDate = e.sanctionedDate; sanctionedOD = e.sanctionedOD;
          orderDocumentLeaveId = e.orderDocumentLeaveId; orderNumber = e.orderNumber;
          availed = e.availed; availedDates = e.availedDates; remarks = e.remarks; createdAt = e.createdAt; }
      })
    };
    Array.find(src, func(e : LeaveEntry) : Bool { e.id == id })
  };

  public func updateLeaveEntry(id : Nat, input : LeaveEntryInput) : async Bool {
    if (not leaveEntriesMigrated) {
      leaveEntriesV2 := Array.map(
        leaveEntries,
        func(e : LeaveEntryLegacy) : LeaveEntry {
          { id = e.id; userId = 1; leaveType = e.leaveType; holidayDutyDate = e.holidayDutyDate;
            sanctionedDate = e.sanctionedDate; sanctionedOD = e.sanctionedOD;
            orderDocumentLeaveId = e.orderDocumentLeaveId; orderNumber = e.orderNumber;
            availed = e.availed; availedDates = e.availedDates; remarks = e.remarks; createdAt = e.createdAt; }
        },
      );
      leaveEntries := [];
      leaveEntriesMigrated := true;
    };
    var found = false;
    leaveEntriesV2 := Array.map(
      leaveEntriesV2,
      func(e : LeaveEntry) : LeaveEntry {
        if (e.id == id) {
          found := true;
          {
            id = e.id;
            userId = input.userId;
            leaveType = input.leaveType;
            holidayDutyDate = input.holidayDutyDate;
            sanctionedDate = input.sanctionedDate;
            sanctionedOD = input.sanctionedOD;
            orderDocumentLeaveId = input.orderDocumentLeaveId;
            orderNumber = input.orderNumber;
            availed = input.availed;
            availedDates = input.availedDates;
            remarks = input.remarks;
            createdAt = e.createdAt;
          }
        } else { e }
      },
    );
    found
  };

  public func deleteLeaveEntry(id : Nat) : async Bool {
    if (not leaveEntriesMigrated) {
      leaveEntriesV2 := Array.map(
        leaveEntries,
        func(e : LeaveEntryLegacy) : LeaveEntry {
          { id = e.id; userId = 1; leaveType = e.leaveType; holidayDutyDate = e.holidayDutyDate;
            sanctionedDate = e.sanctionedDate; sanctionedOD = e.sanctionedOD;
            orderDocumentLeaveId = e.orderDocumentLeaveId; orderNumber = e.orderNumber;
            availed = e.availed; availedDates = e.availedDates; remarks = e.remarks; createdAt = e.createdAt; }
        },
      );
      leaveEntries := [];
      leaveEntriesMigrated := true;
    };
    let before = leaveEntriesV2.size();
    leaveEntriesV2 := Array.filter(leaveEntriesV2, func(e : LeaveEntry) : Bool { e.id != id });
    leaveEntriesV2.size() < before
  };

  // ---- Upcoming Duties (Module 3) ----
  type UpcomingDutyLegacy = {
    id : Nat;
    dutyDate : Int;
    reportingTime : Text;
    workType : Text;
    dutyRole : Text;
    orderNumber : Text;
    reminderEnabled : Bool;
    status : Text;
    createdAt : Int;
  };

  public type UpcomingDuty = {
    id : Nat;
    userId : Nat;
    dutyDate : Int;
    reportingTime : Text;
    workType : Text;
    dutyRole : Text;
    orderNumber : Text;
    reminderEnabled : Bool;
    status : Text;
    createdAt : Int;
  };

  public type UpcomingDutyInput = {
    userId : Nat;
    dutyDate : Int;
    reportingTime : Text;
    workType : Text;
    dutyRole : Text;
    orderNumber : Text;
    reminderEnabled : Bool;
    status : Text;
  };

  stable var nextUpcomingId : Nat = 1;
  stable var upcomingDuties : [UpcomingDutyLegacy] = [];
  stable var upcomingDutiesV2 : [UpcomingDuty] = [];
  stable var upcomingDutiesMigrated : Bool = false;

  public func addUpcomingDuty(input : UpcomingDutyInput) : async Nat {
    if (not upcomingDutiesMigrated) {
      upcomingDutiesV2 := Array.map(
        upcomingDuties,
        func(e : UpcomingDutyLegacy) : UpcomingDuty {
          { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
            workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
            reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
        },
      );
      upcomingDuties := [];
      upcomingDutiesMigrated := true;
    };
    let id = nextUpcomingId;
    nextUpcomingId += 1;
    let entry : UpcomingDuty = {
      id;
      userId = input.userId;
      dutyDate = input.dutyDate;
      reportingTime = input.reportingTime;
      workType = input.workType;
      dutyRole = input.dutyRole;
      orderNumber = input.orderNumber;
      reminderEnabled = input.reminderEnabled;
      status = input.status;
      createdAt = Time.now();
    };
    upcomingDutiesV2 := Array.append(upcomingDutiesV2, [entry]);
    id
  };

  public query func getAllUpcomingDuties() : async [UpcomingDuty] {
    let src = if (upcomingDutiesMigrated) { upcomingDutiesV2 } else {
      Array.map(upcomingDuties, func(e : UpcomingDutyLegacy) : UpcomingDuty {
        { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
          workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
          reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
      })
    };
    Array.sort(
      src,
      func(a : UpcomingDuty, b : UpcomingDuty) : Order.Order {
        if (a.dutyDate < b.dutyDate) { #less }
        else if (a.dutyDate > b.dutyDate) { #greater }
        else { #equal }
      },
    )
  };

  public query func getUpcomingDutiesByUser(userId : Nat) : async [UpcomingDuty] {
    let src = if (upcomingDutiesMigrated) { upcomingDutiesV2 } else {
      Array.map(upcomingDuties, func(e : UpcomingDutyLegacy) : UpcomingDuty {
        { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
          workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
          reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
      })
    };
    let filtered = Array.filter(src, func(e : UpcomingDuty) : Bool { e.userId == userId });
    Array.sort(
      filtered,
      func(a : UpcomingDuty, b : UpcomingDuty) : Order.Order {
        if (a.dutyDate < b.dutyDate) { #less }
        else if (a.dutyDate > b.dutyDate) { #greater }
        else { #equal }
      },
    )
  };

  public query func getUpcomingDuty(id : Nat) : async ?UpcomingDuty {
    let src = if (upcomingDutiesMigrated) { upcomingDutiesV2 } else {
      Array.map(upcomingDuties, func(e : UpcomingDutyLegacy) : UpcomingDuty {
        { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
          workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
          reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
      })
    };
    Array.find(src, func(e : UpcomingDuty) : Bool { e.id == id })
  };

  public func updateUpcomingDuty(id : Nat, input : UpcomingDutyInput) : async Bool {
    if (not upcomingDutiesMigrated) {
      upcomingDutiesV2 := Array.map(
        upcomingDuties,
        func(e : UpcomingDutyLegacy) : UpcomingDuty {
          { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
            workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
            reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
        },
      );
      upcomingDuties := [];
      upcomingDutiesMigrated := true;
    };
    var found = false;
    upcomingDutiesV2 := Array.map(
      upcomingDutiesV2,
      func(e : UpcomingDuty) : UpcomingDuty {
        if (e.id == id) {
          found := true;
          {
            id = e.id;
            userId = input.userId;
            dutyDate = input.dutyDate;
            reportingTime = input.reportingTime;
            workType = input.workType;
            dutyRole = input.dutyRole;
            orderNumber = input.orderNumber;
            reminderEnabled = input.reminderEnabled;
            status = input.status;
            createdAt = e.createdAt;
          }
        } else { e }
      },
    );
    found
  };

  public func deleteUpcomingDuty(id : Nat) : async Bool {
    if (not upcomingDutiesMigrated) {
      upcomingDutiesV2 := Array.map(
        upcomingDuties,
        func(e : UpcomingDutyLegacy) : UpcomingDuty {
          { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
            workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
            reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
        },
      );
      upcomingDuties := [];
      upcomingDutiesMigrated := true;
    };
    let before = upcomingDutiesV2.size();
    upcomingDutiesV2 := Array.filter(upcomingDutiesV2, func(e : UpcomingDuty) : Bool { e.id != id });
    upcomingDutiesV2.size() < before
  };

  // Mark as completed: copies into DutyEntry with userId, marks status Completed
  public func markUpcomingDutyCompleted(id : Nat) : async Bool {
    let src = if (upcomingDutiesMigrated) { upcomingDutiesV2 } else {
      Array.map(upcomingDuties, func(e : UpcomingDutyLegacy) : UpcomingDuty {
        { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
          workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
          reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
      })
    };
    let found = Array.find(src, func(e : UpcomingDuty) : Bool { e.id == id });
    switch (found) {
      case null { false };
      case (?duty) {
        let newId = nextId;
        nextId += 1;
        let entry : DutyEntry = {
          id = newId;
          userId = duty.userId;
          dutyDate = duty.dutyDate;
          reportingTime = ?duty.reportingTime;
          workType = duty.workType;
          dutyRole = duty.dutyRole;
          orderNo = duty.orderNumber;
          remunerationAmount = 0.0;
          remunerationCredited = false;
          remunerationCreditDate = null;
          taEligible = false;
          taAmount = null;
          taSubmissionStatus = null;
          taCredited = null;
          taCreditDate = null;
          orderDocumentId = null;
          remarks = null;
          createdAt = Time.now();
        };
        entriesV3 := Array.append(entriesV3, [entry]);
        if (not upcomingDutiesMigrated) {
          upcomingDutiesV2 := Array.map(
            upcomingDuties,
            func(e : UpcomingDutyLegacy) : UpcomingDuty {
              { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
                workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
                reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
            },
          );
          upcomingDuties := [];
          upcomingDutiesMigrated := true;
        };
        upcomingDutiesV2 := Array.map(
          upcomingDutiesV2,
          func(e : UpcomingDuty) : UpcomingDuty {
            if (e.id == id) { { e with status = "Completed" } } else { e }
          },
        );
        true
      };
    }
  };

  public func markUpcomingDutyMissed(id : Nat) : async Bool {
    if (not upcomingDutiesMigrated) {
      upcomingDutiesV2 := Array.map(
        upcomingDuties,
        func(e : UpcomingDutyLegacy) : UpcomingDuty {
          { id = e.id; userId = 1; dutyDate = e.dutyDate; reportingTime = e.reportingTime;
            workType = e.workType; dutyRole = e.dutyRole; orderNumber = e.orderNumber;
            reminderEnabled = e.reminderEnabled; status = e.status; createdAt = e.createdAt; }
        },
      );
      upcomingDuties := [];
      upcomingDutiesMigrated := true;
    };
    var found = false;
    upcomingDutiesV2 := Array.map(
      upcomingDutiesV2,
      func(e : UpcomingDuty) : UpcomingDuty {
        if (e.id == id) {
          found := true;
          { e with status = "Missed" }
        } else { e }
      },
    );
    found
  };
};

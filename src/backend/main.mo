import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat64 "mo:core/Nat64";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import UserApproval "user-approval/approval";
import AccessControl "authorization/access-control";
import Migration "migration";

import MixinAuthorization "authorization/MixinAuthorization";
import OutCall "http-outcalls/outcall";

// Run data migration on upgrade
(with migration = Migration.run)
actor {
  public type FaceEmbeddings = Blob;
  public type UserRole = {
    #admin;
    #agent;
  };

  public type AgentProfile = {
    name : Text;
    mobile : Text;
    email : Text;
    faceEmbeddings : FaceEmbeddings;
    status : UserApproval.ApprovalStatus;
    principal : Principal;
  };

  public type UserProfile = {
    name : Text;
    mobile : Text;
    email : Text;
  };

  public type Customer = {
    name : Text;
    mobile : Text;
    email : ?Text;
    requirement : Requirement;
    assignedAgent : Text;
    followUpStatus : Text;
    createdAt : Nat64;
  };

  public type Requirement = {
    #RWA_flat;
    #Semi_furnished_flat;
    #Fully_furnished_flat;
    #Rent;
    #Sell;
    #Purchase;
    #Interior;
  };

  public type LeadStatus = {
    #new;
    #converted;
    #lost;
    #going_on;
  };

  public type Lead = {
    name : Text;
    mobile : Text;
    email : ?Text;
    status : LeadStatus;
    requirement : LeadRequirement;
    assignedAgent : Text;
    description : Text;
    remarks : ?Text;
    createdAt : Time.Time;
    remarksTimestamp : ?Time.Time;
  };

  public type LeadRequirement = {
    #RWA_flat;
    #Semi_furnished_flat;
    #Fully_furnished_flat;
  };

  public type FollowUp = {
    id : Text;
    linkedId : Text;
    type_ : Text;
    agent : Text;
    followUpTime : Time.Time;
    remarks : Text;
    status : Text;
    createdAt : Time.Time;
  };

  public type MessageDirection = {
    #sent;
    #received;
  };

  public type MessageStatus = {
    #pending;
    #delivered;
    #read;
  };

  public type ChatParticipant = {
    #agent : Text;
    #customer : Text;
    #lead : Text;
  };

  public type WhatsAppMessage = {
    id : Text;
    participant : ChatParticipant;
    content : Text;
    timestamp : Time.Time;
    direction : MessageDirection;
    messageType : Text;
    status : MessageStatus;
  };

  public type CallLog = {
    id : Text;
    participant : ChatParticipant;
    duration : Nat;
    timestamp : Time.Time;
    callType : Text;
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  module Lead {
    public func compare(a : Lead, b : Lead) : Order.Order {
      Text.compare(a.name, b.name);
    };
  };

  let agentProfiles = Map.empty<Text, AgentProfile>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let customers = Map.empty<Text, Customer>();
  let leads = Map.empty<Text, Lead>();
  let followUps = Map.empty<Text, FollowUp>();
  let whatsappMessages = Map.empty<Text, WhatsAppMessage>();
  let callLogs = Map.empty<Text, CallLog>();

  // Maps for tracking login times and active status
  let agentLoginTimes = Map.empty<Text, Time.Time>();
  let agentActiveStatus = Map.empty<Text, Bool>();

  // Preconfigured admin details
  let adminDetails = {
    name = "Vipin Maurya";
    mobile = "7217637770";
    email = "infravrhomes@gmail.com";
  };

  // Initialize authorization and user approval state with access control
  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);
  include MixinAuthorization(accessControlState);

  // Helper function to get agent mobile from principal
  private func getAgentMobile(caller : Principal) : ?Text {
    for ((mobile, profile) in agentProfiles.entries()) {
      if (Principal.equal(profile.principal, caller)) {
        return ?mobile;
      };
    };
    null;
  };

  // Helper function to check if caller is approved agent
  private func isApprovedAgent(caller : Principal) : Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return true;
    };
    UserApproval.isApproved(approvalState, caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check approval status");
    };
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Customer Management
  public shared ({ caller }) func addCustomer(
    name : Text,
    mobile : Text,
    email : ?Text,
    requirement : Requirement,
    assignedAgent : Text,
    followUpStatus : Text,
  ) : async Text {
    // Check if caller is approved agent or admin
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can add customers");
    };

    // If not admin, verify agent can only add customers assigned to themselves
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let callerMobile = getAgentMobile(caller);
      switch (callerMobile) {
        case null { Runtime.trap("Unauthorized: Agent profile not found") };
        case (?mobile_) {
          if (mobile_ != assignedAgent) {
            Runtime.trap("Unauthorized: Agents can only add customers assigned to themselves");
          };
        };
      };
    };

    let customerId = mobile # "-" # Time.now().toText();
    let customer : Customer = {
      name = name;
      mobile = mobile;
      email = email;
      requirement = requirement;
      assignedAgent = assignedAgent;
      followUpStatus = followUpStatus;
      createdAt = Nat64.fromNat(0);
    };
    customers.add(customerId, customer);
    customerId;
  };

  public query ({ caller }) func getCustomers() : async [(Text, Customer)] {
    // Admin can view all customers
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return customers.entries().toArray();
    };

    // Approved agents can only view their own customers
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view customers");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let filtered = customers.entries().filter(
          func((_, customer)) : Bool {
            customer.assignedAgent == mobile;
          }
        );
        filtered.toArray();
      };
    };
  };

  // Lead Management
  public shared ({ caller }) func addLead(
    name : Text,
    mobile : Text,
    email : ?Text,
    status : LeadStatus,
    requirement : LeadRequirement,
    assignedAgent : Text,
    description : Text,
    remarks : ?Text,
    remarksTimestamp : ?Nat64,
  ) : async Text {
    // Check if caller is approved agent or admin
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can add leads");
    };

    // If not admin, verify agent can only add leads assigned to themselves
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let callerMobile = getAgentMobile(caller);
      switch (callerMobile) {
        case null { Runtime.trap("Unauthorized: Agent profile not found") };
        case (?mobile_) {
          if (mobile_ != assignedAgent) {
            Runtime.trap("Unauthorized: Agents can only add leads assigned to themselves");
          };
        };
      };
    };

    let leadId = mobile # "-" # Time.now().toText();
    let now = Time.now();
    let lead : Lead = {
      name = name;
      mobile = mobile;
      email = email;
      status = status;
      requirement = requirement;
      assignedAgent = assignedAgent;
      description = description;
      remarks = remarks;
      createdAt = now;
      remarksTimestamp = switch (remarksTimestamp) {
        case null { null };
        case (?ts) { ?ts.toNat() };
      };
    };
    leads.add(leadId, lead);
    leadId;
  };

  public query ({ caller }) func getLeads() : async [(Text, Lead)] {
    // Admin can view all leads
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return leads.entries().toArray();
    };

    // Approved agents can only view their own leads
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view leads");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let filtered = leads.entries().filter(
          func((_, lead)) : Bool {
            lead.assignedAgent == mobile;
          }
        );
        filtered.toArray();
      };
    };
  };

  // Follow-up Management
  public shared ({ caller }) func addFollowUp(
    linkedId : Text,
    type_ : Text,
    agent : Text,
    followUpTime : Time.Time,
    remarks : Text,
    status : Text,
  ) : async Text {
    // Check if caller is approved agent or admin
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can add follow-ups");
    };

    // If not admin, verify agent can only add follow-ups for themselves
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let callerMobile = getAgentMobile(caller);
      switch (callerMobile) {
        case null { Runtime.trap("Unauthorized: Agent profile not found") };
        case (?mobile) {
          if (mobile != agent) {
            Runtime.trap("Unauthorized: Agents can only add follow-ups for themselves");
          };
        };
      };
    };

    let followUpId = linkedId # "-" # Time.now().toText();
    let followUp : FollowUp = {
      id = followUpId;
      linkedId = linkedId;
      type_ = type_;
      agent = agent;
      followUpTime = followUpTime;
      remarks = remarks;
      status = status;
      createdAt = Time.now();
    };
    followUps.add(followUpId, followUp);
    followUpId;
  };

  public query ({ caller }) func getFollowUps() : async [(Text, FollowUp)] {
    // Admin can view all follow-ups
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return followUps.entries().toArray();
    };

    // Approved agents can only view their own follow-ups
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view follow-ups");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let filtered = followUps.entries().filter(
          func((_, followUp)) : Bool {
            followUp.agent == mobile;
          }
        );
        filtered.toArray();
      };
    };
  };

  public shared ({ caller }) func updateFollowUp(
    followUpId : Text,
    remarks : Text,
    status : Text,
  ) : async () {
    // Admin can update any follow-up
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let followUp = switch (followUps.get(followUpId)) {
        case null { Runtime.trap("Follow-up not found") };
        case (?f) { f };
      };
      let updated : FollowUp = {
        id = followUp.id;
        linkedId = followUp.linkedId;
        type_ = followUp.type_;
        agent = followUp.agent;
        followUpTime = followUp.followUpTime;
        remarks = remarks;
        status = status;
        createdAt = followUp.createdAt;
      };
      followUps.add(followUpId, updated);
      return;
    };

    // Approved agents can only update their own follow-ups
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can update follow-ups");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let followUp = switch (followUps.get(followUpId)) {
          case null { Runtime.trap("Follow-up not found") };
          case (?f) { f };
        };
        if (followUp.agent != mobile) {
          Runtime.trap("Unauthorized: Can only update your own follow-ups");
        };
        let updated : FollowUp = {
          id = followUp.id;
          linkedId = followUp.linkedId;
          type_ = followUp.type_;
          agent = followUp.agent;
          followUpTime = followUp.followUpTime;
          remarks = remarks;
          status = status;
          createdAt = followUp.createdAt;
        };
        followUps.add(followUpId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteFollowUp(followUpId : Text) : async () {
    // Admin can delete any follow-up
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      if (not followUps.containsKey(followUpId)) {
        Runtime.trap("Follow-up not found");
      };
      followUps.remove(followUpId);
      return;
    };

    // Approved agents can only delete their own follow-ups
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can delete follow-ups");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let followUp = switch (followUps.get(followUpId)) {
          case null { Runtime.trap("Follow-up not found") };
          case (?f) { f };
        };
        if (followUp.agent != mobile) {
          Runtime.trap("Unauthorized: Can only delete your own follow-ups");
        };
        followUps.remove(followUpId);
      };
    };
  };

  // WhatsApp Message Management
  public shared ({ caller }) func addWhatsAppMessage(
    participant : ChatParticipant,
    content : Text,
    direction : MessageDirection,
    messageType : Text,
    status : MessageStatus,
  ) : async Text {
    // Check if caller is approved agent or admin
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can send WhatsApp messages");
    };

    // If not admin, verify agent can only send messages as themselves
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let callerMobile = getAgentMobile(caller);
      switch (callerMobile) {
        case null { Runtime.trap("Unauthorized: Agent profile not found") };
        case (?mobile) {
          switch (participant) {
            case (#agent(agentMobile)) {
              if (agentMobile != mobile) {
                Runtime.trap("Unauthorized: Agents can only send messages as themselves");
              };
            };
            case _ {};
          };
        };
      };
    };

    let messageId = Time.now().toText();
    let message : WhatsAppMessage = {
      id = messageId;
      participant = participant;
      content = content;
      timestamp = Time.now();
      direction = direction;
      messageType = messageType;
      status = status;
    };
    whatsappMessages.add(messageId, message);
    messageId;
  };

  public query ({ caller }) func getWhatsAppMessages() : async [(Text, WhatsAppMessage)] {
    // Admin can view all messages
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return whatsappMessages.entries().toArray();
    };

    // Approved agents can only view their own messages
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view WhatsApp messages");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let filtered = whatsappMessages.entries().filter(
          func((_, message)) : Bool {
            switch (message.participant) {
              case (#agent(agentMobile)) { agentMobile == mobile };
              case _ { false };
            };
          }
        );
        filtered.toArray();
      };
    };
  };

  // Call Log Management
  public shared ({ caller }) func addCallLog(
    participant : ChatParticipant,
    duration : Nat,
    callType : Text,
  ) : async Text {
    // Check if caller is approved agent or admin
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can log calls");
    };

    // If not admin, verify agent can only log calls for themselves
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      let callerMobile = getAgentMobile(caller);
      switch (callerMobile) {
        case null { Runtime.trap("Unauthorized: Agent profile not found") };
        case (?mobile) {
          switch (participant) {
            case (#agent(agentMobile)) {
              if (agentMobile != mobile) {
                Runtime.trap("Unauthorized: Agents can only log calls for themselves");
              };
            };
            case _ {};
          };
        };
      };
    };

    let callId = Time.now().toText();
    let callLog : CallLog = {
      id = callId;
      participant = participant;
      duration = duration;
      timestamp = Time.now();
      callType = callType;
    };
    callLogs.add(callId, callLog);
    callId;
  };

  public query ({ caller }) func getCallLogs() : async [(Text, CallLog)] {
    // Admin can view all call logs
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return callLogs.entries().toArray();
    };

    // Approved agents can only view their own call logs
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view call logs");
    };

    let callerMobile = getAgentMobile(caller);
    switch (callerMobile) {
      case null { Runtime.trap("Unauthorized: Agent profile not found") };
      case (?mobile) {
        let filtered = callLogs.entries().filter(
          func((_, callLog)) : Bool {
            switch (callLog.participant) {
              case (#agent(agentMobile)) { agentMobile == mobile };
              case _ { false };
            };
          }
        );
        filtered.toArray();
      };
    };
  };

  // HTTP Outcall - transform function must be accessible without auth checks
  // as it's called by the IC system during HTTP outcalls
  public shared query ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func makeHttpGetRequest(url : Text) : async Text {
    // Only approved agents and admins can make HTTP requests
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can make HTTP requests");
    };
    await OutCall.httpGetRequest(url, [], transform);
  };

  // Agent registration - requires user authentication
  public shared ({ caller }) func registerAgent(
    name : Text,
    mobile : Text,
    email : Text,
    faceEmbeddings : Blob,
  ) : async () {
    // Require user-level authentication for registration
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register as agents");
    };

    // Check if mobile number already registered
    if (agentProfiles.containsKey(mobile)) {
      Runtime.trap("Mobile number already registered");
    };

    // Validate face embeddings are not empty
    if (faceEmbeddings.size() == 0) {
      Runtime.trap("Face capture is mandatory for registration");
    };

    // Store agent profile in map with pending status
    let profile : AgentProfile = {
      name;
      mobile;
      email;
      faceEmbeddings;
      status = #pending;
      principal = caller;
    };
    agentProfiles.add(mobile, profile);

    // Add agent profile to userProfiles map
    let userProfile : UserProfile = {
      name;
      mobile;
      email;
    };
    userProfiles.add(caller, userProfile);

    // Track login time and active status in separate maps
    agentLoginTimes.add(mobile, Time.now());
    agentActiveStatus.add(mobile, false);

    // Request approval through the approval system
    UserApproval.requestApproval(approvalState, caller);
  };

  // Agent login - requires user authentication and approval
  public shared ({ caller }) func loginAgent(faceEmbeddings : Blob) : async () {
    // Require user-level authentication for login
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can login");
    };

    // Validate face embeddings are provided
    if (faceEmbeddings.size() == 0) {
      Runtime.trap("Face verification is mandatory for login");
    };

    // Get agent mobile
    let mobile = switch (getAgentMobile(caller)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?m) { m };
    };

    // Get agent profile
    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    // Check approval status - only approved agents can login
    if (not UserApproval.isApproved(approvalState, caller)) {
      switch (profile.status) {
        case (#pending) { Runtime.trap("Agent registration pending approval") };
        case (#rejected) { Runtime.trap("Agent registration rejected") };
        case (#approved) { Runtime.trap("Agent not approved in system") };
      };
    };

    // Verify face embeddings match (basic check - in production use proper face recognition)
    if (profile.faceEmbeddings != faceEmbeddings) {
      Runtime.trap("Face verification failed");
    };

    // Track login time and active status
    agentLoginTimes.add(mobile, Time.now());
    agentActiveStatus.add(mobile, true);
  };

  // Agent logout - requires user authentication
  public shared ({ caller }) func logoutAgent() : async () {
    // Require user-level authentication for logout
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can logout");
    };

    // Get agent mobile for the caller
    let mobile = switch (getAgentMobile(caller)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?m) { m };
    };

    // Verify the agent profile exists
    if (not agentProfiles.containsKey(mobile)) {
      Runtime.trap("Agent profile not found");
    };

    // Only the agent themselves or admin can logout
    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    if (not Principal.equal(caller, profile.principal) and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only logout yourself");
    };

    agentActiveStatus.add(mobile, false);
  };

  // Admin-only: Retrieve all agent profiles
  public query ({ caller }) func getAllAgentProfiles() : async [AgentProfile] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch agent profiles");
    };
    agentProfiles.values().toArray();
  };

  // Get own agent profile - requires approval
  public query ({ caller }) func getAgentProfileByCaller() : async AgentProfile {
    if (not isApprovedAgent(caller)) {
      Runtime.trap("Unauthorized: Only approved agents can view profiles");
    };

    let mobile = switch (getAgentMobile(caller)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?m) { m };
    };

    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    profile;
  };

  // Admin-only: Retrieve agent login times and status
  public query ({ caller }) func getAgentLoginTimesAndStatus() : async [(Text, Time.Time, Bool)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can fetch agent login times and statuses");
    };

    let loginTimes = agentLoginTimes.entries().toArray();
    let result = loginTimes.map(
      func((mobile, time)) {
        let status = switch (agentActiveStatus.get(mobile)) {
          case null { false };
          case (?s) { s };
        };
        (mobile, time, status);
      }
    );
    result;
  };

  // Admin-only: Update agent profile
  public shared ({ caller }) func updateAgentProfile(
    mobile : Text,
    name : Text,
    email : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update agent profiles");
    };

    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    let updated : AgentProfile = {
      name = name;
      mobile = mobile;
      email = email;
      faceEmbeddings = profile.faceEmbeddings;
      status = profile.status;
      principal = profile.principal;
    };

    agentProfiles.add(mobile, updated);

    // Update userProfiles as well
    let userProfile : UserProfile = {
      name = name;
      mobile = mobile;
      email = email;
    };
    userProfiles.add(profile.principal, userProfile);
  };

  // Admin-only: Delete agent and associated data
  public shared ({ caller }) func deleteAgent(mobile : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete agents");
    };

    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    // Delete agent profile
    agentProfiles.remove(mobile);
    userProfiles.remove(profile.principal);
    agentLoginTimes.remove(mobile);
    agentActiveStatus.remove(mobile);

    // Delete associated customers
    let customerKeys = customers.entries().filter(
      func((_, customer)) : Bool {
        customer.assignedAgent == mobile;
      }
    ).map(func((key, _)) : Text { key }).toArray();

    for (key in customerKeys.vals()) {
      customers.remove(key);
    };

    // Delete associated leads
    let leadKeys = leads.entries().filter(
      func((_, lead)) : Bool {
        lead.assignedAgent == mobile;
      }
    ).map(func((key, _)) : Text { key }).toArray();

    for (key in leadKeys.vals()) {
      leads.remove(key);
    };

    // Delete associated follow-ups
    let followUpKeys = followUps.entries().filter(
      func((_, followUp)) : Bool {
        followUp.agent == mobile;
      }
    ).map(func((key, _)) : Text { key }).toArray();

    for (key in followUpKeys.vals()) {
      followUps.remove(key);
    };
  };

  // Admin-only: Approve agent registration
  public shared ({ caller }) func approveAgent(mobile : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve agents");
    };

    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    // Update profile status
    let updated : AgentProfile = {
      name = profile.name;
      mobile = profile.mobile;
      email = profile.email;
      faceEmbeddings = profile.faceEmbeddings;
      status = #approved;
      principal = profile.principal;
    };
    agentProfiles.add(mobile, updated);

    // Approve in the approval system
    UserApproval.setApproval(approvalState, profile.principal, #approved);
  };

  // Admin-only: Reject agent registration
  public shared ({ caller }) func rejectAgent(mobile : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject agents");
    };

    let profile = switch (agentProfiles.get(mobile)) {
      case null { Runtime.trap("Agent profile not found") };
      case (?p) { p };
    };

    // Update profile status
    let updated : AgentProfile = {
      name = profile.name;
      mobile = profile.mobile;
      email = profile.email;
      faceEmbeddings = profile.faceEmbeddings;
      status = #rejected;
      principal = profile.principal;
    };
    agentProfiles.add(mobile, updated);

    // Reject in the approval system
    UserApproval.setApproval(approvalState, profile.principal, #rejected);
  };
};

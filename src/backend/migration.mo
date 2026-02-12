import Map "mo:core/Map";
import Text "mo:core/Text";
import UserApproval "user-approval/approval";

module {
  type OldAgentProfile = {
    name : Text;
    mobile : Text;
    email : Text;
    faceEmbeddings : Blob;
    status : UserApproval.ApprovalStatus;
    principal : Principal;
  };

  // Original actor type
  type OldActor = {
    agentProfiles : Map.Map<Text, OldAgentProfile>;
  };

  // New agent profile type
  type NewAgentProfile = {
    name : Text;
    mobile : Text;
    email : Text;
    faceEmbeddings : Blob;
    status : UserApproval.ApprovalStatus;
    principal : Principal;
  };

  // New actor type
  type NewActor = {
    agentProfiles : Map.Map<Text, NewAgentProfile>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    let newAgentProfiles = old.agentProfiles.map<Text, OldAgentProfile, NewAgentProfile>(
      func(_mobile, oldProfile) {
        {
          name = oldProfile.name;
          mobile = oldProfile.mobile;
          email = oldProfile.email;
          faceEmbeddings = oldProfile.faceEmbeddings;
          status = #pending; // Set all existing profiles to pending during migration
          principal = oldProfile.principal;
        };
      }
    );
    { agentProfiles = newAgentProfiles };
  };
};

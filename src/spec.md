# Specification

## Summary
**Goal:** Fix agent registration and admin approval workflows so newly registered agents reliably appear in the Admin pending-approval list and move correctly between pending/approved/rejected states.

**Planned changes:**
- Persist newly registered agents in backend with an initial approval status of “pending” so they appear immediately in Admin pending approval.
- Align `getAllAgentProfiles()` to return a `status` field that reflects the same underlying approval state used by the approval system (pending/approved/rejected), ensuring Admin filtering works.
- Ensure Admin `approveAgent(mobile)` / `rejectAgent(mobile)` updates the same approval state displayed in Admin lists so agents move between views after the next fetch/refetch.
- Update Admin frontend approval views to surface backend fetch errors (with readable message and retry/re-login guidance) instead of silently showing an empty pending list.

**User-visible outcome:** After an agent registers, admins can see the agent in the pending list right away, approve/reject actions correctly move the agent between Pending and Approved/Rejected views, and admins see clear error messages if the pending list cannot be loaded.

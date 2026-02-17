# Specification

## Summary
**Goal:** Fix role registration (traveller/driver/admin) so signed-in users can register without backend traps and are routed to the correct dashboard based on their saved profile/role.

**Planned changes:**
- Diagnose and fix the end-to-end registration flow for Traveller and Driver so backend returns a structured success/failure and the frontend navigates only on success.
- Update backend adminRegister/driverRegister/travellerRegister to avoid Runtime.trap for expected errors; return RegistrationStatus.failure with clear English messages instead.
- Align backend UserProfile.role encoding with candid-generated frontend types so App.tsx can reliably detect admin/driver/traveller and route accordingly.
- Implement a workable admin registration rule: allow first admin creation when none exists; otherwise enforce authorization and return friendly failure messages (no traps).
- Ensure frontend displays exact backend failure messages for registration failures and avoids unhandled exceptions/blank screens.

**User-visible outcome:** When signed in with Internet Identity, users can successfully register as Traveller or Driver (with valid bus number) and be taken to the correct dashboard; admin registration works for first-time setup or authorized admins, and any registration failure shows a clear backend-provided message without crashing or navigating away.

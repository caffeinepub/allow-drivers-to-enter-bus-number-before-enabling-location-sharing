# Specification

## Summary
**Goal:** Require drivers to register a bus number on the Driver Dashboard before they can enable live location sharing.

**Planned changes:**
- Update the Driver Dashboard to detect when the logged-in driver has no bus number and show a bus number entry form with a clear save/register action.
- Disable (or replace) the “Share Live Location” control until a valid bus number is successfully registered.
- On bus number submission, call the existing driver registration mutation (driverRegister), show success/error feedback, and refresh the cached user/driver profile so the dashboard updates immediately.
- Clean up the “no bus number” UI state to avoid empty bus labels/badges, and guard location update logic so updates are only sent when sharing is enabled and a bus number exists.
- Ensure all user-facing text for this flow is in English.

**User-visible outcome:** A driver without a bus number will be prompted to enter and register one on the dashboard, and only then can they turn on live location sharing; errors prevent enabling sharing until resolved.

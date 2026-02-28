# Specification

## Summary
**Goal:** Fix the user registration flow so that travellers, drivers, and admins can successfully register and be navigated to their respective dashboards.

**Planned changes:**
- Investigate and fix the RegisterPage to correctly call the backend `registerAdmin`, `registerDriver`, and `registerTraveller` mutations
- Ensure registration errors are caught and displayed as clear, user-friendly messages
- After successful registration, navigate the user to their role-based dashboard
- Verify the backend registration endpoints return success responses for valid inputs

**User-visible outcome:** Users can complete registration as a traveller, driver, or admin without errors, see friendly messages if something goes wrong, and are automatically redirected to their dashboard upon success.

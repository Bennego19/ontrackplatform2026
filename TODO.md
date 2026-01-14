# TODO: Fix URL Redirects for www.ontrackconnect.co.za

## Completed Tasks
- [x] Added redirect middleware in BACKEND/server.mjs to redirect www.ontrackconnect.co.za to https://ontrackconnect.co.za (main website)
- [x] Preserved existing URLs: http://api.ontrackconnect.co.za:3000/ and https://platform.ontrackconnect.co.za/

## Next Steps
- [ ] Test the redirect by accessing http://www.ontrackconnect.co.za/
- [ ] Ensure the backend server is restarted to apply changes
- [ ] If redirect doesn't work, check DNS configuration for www.ontrackconnect.co.za
- [ ] Verify that API calls to http://api.ontrackconnect.co.za:3000/ still work
- [ ] Verify that frontend at https://platform.ontrackconnect.co.za/ still works
- [ ] Verify that main website at https://ontrackconnect.co.za/ works normally

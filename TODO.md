# TODO: Create Events Page with CRUD Operations

## Backend Updates
- [x] Update BACKEND/routes/events.mjs to replace 'time' field with 'type' field (in-person/online)
- [x] Ensure CRUD operations handle the new 'type' field correctly

## Frontend Updates
- [x] Update ontrackapp/src/components/events.js to use 'type' select instead of 'time' input
- [x] Change form fields: name, description, date, type (in-person/online), link (registration)
- [x] Update table headers and displays from 'Time' to 'Type'
- [x] Add route to ontrackapp/src/App.js for /events (already exists)

## Testing
- [ ] Test CRUD operations for events
- [ ] Verify form validation and error handling
- [ ] Check UI layout matches other manage pages

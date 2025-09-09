# TODO: Fix Favorite Button and Comment Issues

## Completed Tasks
- [x] Modified client/js/poem.js to allow anonymous comments (removed user checks and Authorization header)
- [x] Modified client/js/poem.js to allow anonymous favorites (removed login checks and Authorization header)
- [x] Modified server/routes/poems.js to remove auth middleware from POST /:id/comments route
- [x] Modified server/controllers/poemController.js to handle anonymous comments (userId optional)
- [x] Modified serad ver/models/Comment.js to make userId not required for anonymous comments
- [x] Added favorite button styles to client/css/style.css with light and dark theme support
- [x] Fixed ReferenceError in handleCommentSubmit by properly defining form variable
- [x] Modified server/routes/users.js to remove auth middleware from POST /:id/favorites route
- [x] Modified server/controllers/userController.js to handle anonymous favorites using special anonymous user

## Pending Tasks
- [ ] Test favorite button functionality without authentication
- [ ] Test comment submission without authentication
- [ ] Verify favorite button UI looks good in both light and dark themes
- [ ] Verify comment form is visible and functional for all users
- [ ] Test error handling for edge cases (invalid poem IDs, network errors, etc.)
- [ ] Consider adding rate limiting for anonymous comments to prevent spam
- [ ] Test anonymous favorites functionality
- [x] Add CSS styling for authentication forms (login/register)
- [ ] Test auth form styling in both light and dark themes
- [ ] Test auth forms on mobile devices

## Notes
- Comments now work for everyone without requiring login
- Favorites can be toggled without authentication using anonymous user system
- Favorite button has improved styling with hover effects and dark theme support
- All authentication checks have been removed from comment and favorite functionality
- Anonymous favorites are stored under a special "anonymous-user" record

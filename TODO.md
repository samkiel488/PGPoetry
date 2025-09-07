# Implement Comments Feature for Poems

## Tasks
- [x] Create Comment model (server/models/Comment.js)
- [x] Add comment controller functions to poemController.js
- [x] Add comment routes to poems.js
- [x] Update client/poem.html to include comment section
- [x] Update client/js/poem.js to handle comment functionality
- [x] Add CSS styling for comments
- [ ] Test the complete comment feature

## Recent Updates
### Remove Social Share Buttons
- [x] Remove social share buttons rendering from client/js/poem.js
- [x] Comment out share buttons IIFE at the end of poem.js

### Improve Comment Section Styling
- [x] Create client/css/comment-style.css with improved styling for comments
- [x] Update client/poem.html to include comment-style.css
- [x] Add dark theme support for comment section

### Fix Comment Posting Error
- [x] Add 'Accept' header to handleCommentSubmit function in client/js/poem.js
- [x] Ensure proper error handling for comment submission

## Previous Tasks
### Implement Related Poems Recommendation
- [x] Modify getPoemBySlug in server/controllers/poemController.js to fetch and return related poems based on matching tags (limit 3-5)
- [x] Update client/poem.html to add HTML structure for "You may also like" section
- [x] Update loadPoem in client/js/poem.js to render related poems below the poem content
- [ ] Test the implementation by viewing a poem with tags

## Status
In Progress - Comment functionality implemented, testing needed

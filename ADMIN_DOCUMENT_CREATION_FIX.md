# Administrator Document Creation - Troubleshooting

## Issue
Administrator cannot create documents with TOP_SECRET label and CONFIDENTIAL classification.

## What I've Fixed

1. ✅ Added admin bypass in API (`/api/documents` POST endpoint)
2. ✅ Added better error logging
3. ✅ Added console logging for debugging
4. ✅ Improved error messages

## How to Test

1. **Check if you're recognized as Admin:**
   - Open browser console (F12)
   - Go to "New Document" page
   - Check console for: "Submitting document: { isAdmin: true }"

2. **Try creating document:**
   - Select Security Label: TOP_SECRET
   - Select Classification: CONFIDENTIAL
   - Click "Create Document"
   - Check console for any errors

3. **Check server logs:**
   - Look for: "Admin creating document - bypassing all MAC restrictions"
   - Check for any validation errors

## Common Issues

### Issue 1: Not recognized as Admin
**Solution:** Make sure you have the Administrator role assigned
- Run: `npm run verify-permissions <your-username>`
- Check if "Administrator" role is listed

### Issue 2: Validation Error
**Solution:** Check the exact error message
- Look in browser console
- Check the error message displayed on screen
- The error will show what field is invalid

### Issue 3: Role not active
**Solution:** Logout and login again
- Sometimes roles need to be refreshed
- Clear browser cache if needed

## Debug Steps

1. Open browser console (F12)
2. Go to "New Document" page
3. Fill in form:
   - Title: "Test Document"
   - Security Label: TOP_SECRET
   - Classification: CONFIDENTIAL
4. Click "Create Document"
5. Check console for:
   - "Submitting document: { isAdmin: true/false }"
   - Any error messages
6. Check Network tab:
   - Find the POST request to `/api/documents`
   - Check the request payload
   - Check the response

## Expected Behavior

**As Administrator:**
- Should see: "✓ Administrator: You can create documents with any security label"
- Should see: "✓ Administrator: You can create documents with any classification"
- Should be able to select TOP_SECRET and CONFIDENTIAL
- Should successfully create document
- Console should show: "Admin creating document - bypassing all MAC restrictions"

## If Still Not Working

Please provide:
1. The exact error message you see
2. Browser console errors (F12 → Console tab)
3. Network request details (F12 → Network tab → find POST /api/documents)
4. Your username (to verify admin role)


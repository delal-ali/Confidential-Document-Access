# Debug Login/Register Issues

## ✅ Good News: API is Working!

I tested the API endpoints and they're working:
- ✅ Registration: Success
- ✅ Login: Success

## 🔍 What to Check

### 1. Open Browser Console (F12)

1. Go to http://localhost:3000
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Try to register or login
5. Look for any error messages

### 2. Check Network Tab

1. In Developer Tools, click **Network** tab
2. Try to register or login
3. Look for the request to `/api/auth/register` or `/api/auth/login`
4. Click on it to see:
   - **Status** (should be 200 or 201)
   - **Response** (check for error messages)
   - **Request** (check if data is being sent)

### 3. Common Issues

#### Password Requirements Not Met
- Password must be at least 8 characters
- Must have uppercase letter
- Must have lowercase letter
- Must have number
- Must have special character

**Example valid password:** `Test123!@#`

#### User Already Exists
- If you try to register with same email/username twice
- Error: "User with this email or username already exists"

#### Server Not Running
- Make sure you see: `▲ Next.js 14.0.4` in terminal
- Make sure it says: `- Local: http://localhost:3000`

### 4. Test with These Credentials

I already created a test user:
- **Username:** `testuser`
- **Email:** `test@example.com`
- **Password:** `Test123!@#`

Try logging in with these!

---

## 🛠️ Quick Fixes

### If you see "Network error" or "Failed to fetch":
- Make sure server is running: `npm run dev`
- Check if http://localhost:3000 is accessible

### If you see "Password does not meet requirements":
- Use a stronger password like: `Test123!@#`
- Must have: uppercase, lowercase, number, special char

### If you see "User already exists":
- Use a different username/email
- Or delete the user from database: `npx prisma studio`

### If nothing happens when clicking button:
- Check browser console (F12) for JavaScript errors
- Make sure form fields are filled correctly

---

## 📋 Step-by-Step Debug

1. **Open browser:** http://localhost:3000
2. **Open console:** Press F12 → Console tab
3. **Try to register:**
   - Fill all fields
   - Use password: `Test123!@#`
   - Click Register
   - Check console for messages
4. **Check Network tab:**
   - See if request was sent
   - Check response status
   - Check response body

---

## 🎯 What I Added

I've added console logging to help debug:
- Logs when login/register starts
- Logs response status
- Logs response data
- Logs errors with details

**Check your browser console (F12) to see what's happening!**

---

**The API is working - the issue is likely in the frontend or browser. Check the console!** 🔍


# Google Sheets Sync - Token Persistence Fix

## Problem
After implementing Live Sync, users experienced two issues on page reload:
1. **Required reconnection**: Had to manually reconnect to Google Sheets every time
2. **Infinite loading**: App got stuck in loading state with console errors about blocked popups

## Root Cause
The Google Identity Services (GIS) OAuth tokens are **session-based by default** and don't persist across page reloads. The app was attempting "silent authentication" (`trySilentAuth`) which:
- Tried to open a popup with `prompt=none`
- Failed because browsers block popups without user interaction
- Caused the app to get stuck in loading state

## Solution Implemented

### 1. Token Persistence
Added localStorage-based token persistence:

**New Storage Functions** (`storageService.ts`):
```typescript
saveGoogleToken(token)    // Saves token with expiry time
getGoogleToken()          // Retrieves token if not expired
clearGoogleToken()        // Clears saved token
```

**Token Lifecycle**:
- ✅ **On authentication**: Token is saved to localStorage with 1-hour expiry
- ✅ **On page load**: Token is restored from localStorage if valid
- ✅ **On expiry**: Token is automatically cleared
- ✅ **On sign out**: Token is cleared from both memory and localStorage

### 2. Improved Initialization Flow
Updated `App.tsx` initialization to:

**Before** (caused issues):
```typescript
// Always tried silent auth, which failed
await trySilentAuth();
```

**After** (works correctly):
```typescript
// Check if we have a valid saved token
const hasToken = window.gapi?.client?.getToken();

if (hasToken) {
  // Token exists, try to use it
  await fetchExpensesFromSheet(config.spreadsheetId);
  // If successful, we're connected!
} else {
  // No token, show "Reconnect" button
  setIsGoogleConnected(false);
}
```

### 3. Graceful Error Handling
- ❌ **Old**: App got stuck in loading state on auth failure
- ✅ **New**: App loads normally and shows reconnect button

## How It Works Now

### First Connection
1. User enters credentials in Settings
2. Clicks "Connect to Google Sheets"
3. OAuth popup opens (user interaction)
4. User grants permissions
5. **Token is saved to localStorage**
6. Data syncs successfully

### Page Reload
1. App initializes Google API client
2. **Restores token from localStorage**
3. Sets token in Google API client
4. Attempts to fetch data from sheet
5. **If successful**: User stays connected! ✅
6. **If failed** (expired token): Shows reconnect button

### Token Expiry
- Tokens expire after ~1 hour (Google's default)
- App automatically detects expired tokens
- Clears invalid token from storage
- Shows "Session expired. Please reconnect." message
- User clicks "Reconnect Sync" to re-authenticate

## User Experience

### ✅ What Works Now
- **Persistent connection**: Stays connected across page reloads
- **No infinite loading**: App loads normally even if token expired
- **Clear feedback**: Shows exact error messages
- **Auto-reconnect**: Automatically uses saved token if valid
- **Secure**: Tokens expire after 1 hour for security

### ⚠️ Expected Behavior
- **Token expiry**: Users need to reconnect after ~1 hour
- **Browser clear**: Clearing browser data requires reconnection
- **Different device**: Each device needs separate authentication

## Security Considerations

### ✅ Safe
- Tokens are stored in localStorage (same as other app data)
- Tokens expire automatically after 1 hour
- Tokens can be revoked from Google Account settings
- No sensitive credentials (Client ID/API Key) are secrets

### 🔒 Best Practices
- Tokens are **access tokens** (not refresh tokens)
- Short expiry time (1 hour) limits exposure
- User can sign out to clear token immediately
- OAuth 2.0 standard security model

## Testing

### Test Case 1: Normal Reload
1. Connect to Google Sheets
2. Reload page (Cmd+R / Ctrl+R)
3. ✅ **Expected**: App loads, stays connected, syncs automatically

### Test Case 2: Token Expiry
1. Connect to Google Sheets
2. Wait 1+ hour (or manually clear token from localStorage)
3. Reload page
4. ✅ **Expected**: App loads, shows "Session expired" message
5. Click "Reconnect Sync"
6. ✅ **Expected**: OAuth popup opens, reconnects successfully

### Test Case 3: Sign Out
1. Connect to Google Sheets
2. Click "Sign Out"
3. Reload page
4. ✅ **Expected**: App loads, shows "Connect Google" button

### Test Case 4: Invalid Token
1. Connect to Google Sheets
2. Manually corrupt token in localStorage
3. Reload page
4. ✅ **Expected**: App loads, clears bad token, shows reconnect

## Technical Details

### Token Storage Format
```javascript
// localStorage keys
'family_finance_google_token'        // JSON token object
'family_finance_google_token_expiry' // Timestamp (ms)

// Token object structure
{
  access_token: "ya29.a0...",
  expires_in: 3599,
  scope: "https://www.googleapis.com/auth/spreadsheets",
  token_type: "Bearer"
}
```

### Expiry Calculation
```typescript
const expiryTime = Date.now() + (token.expires_in * 1000);
// Default: 3600 seconds = 1 hour
```

### Token Validation
```typescript
// On retrieval
if (Date.now() >= expiryTime) {
  clearGoogleToken();  // Auto-clear expired token
  return null;
}
```

## Troubleshooting

### "Session expired" on every reload
**Cause**: System clock is incorrect or token expiry is miscalculated
**Fix**: Check system time, clear browser cache

### Still getting popup errors
**Cause**: Browser is blocking popups
**Fix**: Allow popups for localhost in browser settings

### Token not persisting
**Cause**: Browser in incognito mode or localStorage disabled
**Fix**: Use normal browsing mode, enable localStorage

## Future Improvements

Potential enhancements:
1. **Refresh tokens**: Implement refresh token flow for longer sessions
2. **Token renewal**: Auto-renew tokens before expiry
3. **Multiple accounts**: Support switching between Google accounts
4. **Offline queue**: Queue changes when offline, sync when reconnected

---

**Status**: ✅ **FIXED**
**Version**: 2.1.0
**Date**: December 7, 2025

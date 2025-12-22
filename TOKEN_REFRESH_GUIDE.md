# Google OAuth Token Refresh Implementation

## Overview

This document explains the automatic token refresh mechanism implemented to handle Google OAuth access token expiration in the SimpleFamFin application.

## The Problem

Google OAuth 2.0 access tokens expire after approximately **1 hour (3600 seconds)**. When using client-side authentication with Google Identity Services (GIS), the application only receives access tokens, not refresh tokens. This means:

- Users would be disconnected after 1 hour
- API calls would fail with 401/403 errors
- Users would need to manually reconnect frequently

## The Solution

We've implemented a **proactive token refresh system** that:

1. **Tracks token expiry time** in localStorage
2. **Proactively refreshes tokens** before they expire (5-minute buffer)
3. **Automatically refreshes** during API operations
4. **Periodically checks** token status even when idle

## Implementation Details

### 1. Enhanced Token Storage (`storageService.ts`)

#### New Functions:

```typescript
// Save token with expiry tracking
saveGoogleToken(token: any): void

// Get token (returns null if expired)
getGoogleToken(): any | null

// Check if token needs refresh (within 5 minutes of expiry)
shouldRefreshToken(): boolean

// Get remaining time in seconds
getTokenTimeRemaining(): number
```

**Key Features:**
- Stores token expiry time with 5-minute buffer
- Automatically clears expired tokens
- Provides helpers to check token status

### 2. Automatic Token Refresh (`googleSheetsService.ts`)

#### New Function:

```typescript
// Ensures token is valid, refreshes if needed
ensureValidToken(): Promise<boolean>
```

**How it works:**
1. Checks if current token exists
2. Checks if token expires within 5 minutes
3. If yes, attempts silent authentication (`trySilentAuth()`)
4. Returns true if token is valid

#### Enhanced Silent Auth:

```typescript
trySilentAuth(): Promise<void>
```

**Improvements:**
- Better error logging
- Automatic token persistence
- Try-catch error handling

### 3. Integration in App.tsx

#### Three-Layer Protection:

**Layer 1: Periodic Token Refresh (Every 4 minutes)**
```typescript
useEffect(() => {
  const checkAndRefreshToken = async () => {
    const tokenValid = await ensureValidToken();
    // Proactively refresh if needed
  };
  
  setInterval(checkAndRefreshToken, 240000); // 4 minutes
}, [isGoogleConnected]);
```

**Layer 2: Pre-Save Token Refresh**
```typescript
// Before auto-saving data
const tokenValid = await ensureValidToken();
if (!tokenValid) {
  await trySilentAuth();
}
```

**Layer 3: Pre-Fetch Token Refresh**
```typescript
// Before polling/fetching data
const tokenValid = await ensureValidToken();
if (!tokenValid) {
  await trySilentAuth();
}
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ User Signs In                                               │
│ ↓                                                           │
│ Token Received (expires in 3600s)                          │
│ ↓                                                           │
│ Token saved with expiry time                               │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Background Monitoring (Every 4 minutes)                     │
│ • Check if token expires in < 5 minutes                     │
│ • If yes → Silent refresh                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Before API Operations                                       │
│ • Check token validity                                      │
│ • Refresh if needed                                         │
│ • Proceed with API call                                     │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ On API Error (401/403)                                      │
│ • Attempt silent refresh                                    │
│ • If fails → Show reconnect modal                           │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### Refresh Timing:

- **Token Expiry**: ~3600 seconds (1 hour)
- **Refresh Buffer**: 300 seconds (5 minutes)
- **Periodic Check**: 240 seconds (4 minutes)
- **Polling Interval**: 30 seconds

### Why These Values?

1. **5-minute buffer**: Gives enough time to refresh before expiry
2. **4-minute periodic check**: Ensures we check before the 5-minute threshold
3. **30-second polling**: Frequent enough for live sync, includes token check

## Error Handling

### Silent Refresh Failures:

```typescript
try {
  await trySilentAuth();
} catch (error) {
  // Don't immediately disconnect
  // Token might still be valid for a few minutes
  // Let the next API call determine if reconnection is needed
}
```

### API Call Failures:

```typescript
catch (e) {
  if (e.status === 401 || e.status === 403) {
    // Try one more silent refresh
    await trySilentAuth();
    // If this fails, show reconnect modal
  }
}
```

## Benefits

✅ **Seamless Experience**: Users stay connected without interruption
✅ **Proactive**: Refreshes before expiry, not after
✅ **Resilient**: Multiple layers of protection
✅ **Transparent**: Automatic with logging for debugging
✅ **Efficient**: Only refreshes when needed

## Limitations

⚠️ **Silent Auth Requirements**:
- User must have an active Google session
- Browser must allow third-party cookies
- May not work in strict privacy modes

⚠️ **Not a True Refresh Token**:
- This is a workaround using silent authentication
- True refresh tokens require server-side OAuth flow

## Future Improvements

For a production application, consider:

1. **Server-Side OAuth** with NextAuth.js
   - True refresh tokens
   - More secure
   - Better control

2. **Token Refresh API**
   - Backend endpoint to refresh tokens
   - Store refresh tokens server-side
   - Client requests new access tokens

3. **WebSocket Connection**
   - Real-time sync without polling
   - More efficient token management

## Testing

### How to Test:

1. **Sign in** to the application
2. **Open DevTools Console** to see token logs
3. **Wait 4 minutes** - should see periodic refresh check
4. **Make changes** - should see pre-save token check
5. **Check localStorage** - should see token and expiry time

### Expected Console Logs:

```
Token saved. Expires in 3600 seconds at 9:30:00 PM
Token check: No valid token found (if expired)
Attempting silent token refresh...
Silent token refresh successful
Token expiring soon, attempting proactive refresh...
```

## Troubleshooting

### Token keeps expiring:
- Check browser privacy settings
- Ensure third-party cookies are allowed
- User may need to stay signed in to Google

### Silent refresh fails:
- User may need to manually reconnect
- Check Google session is active
- Verify OAuth consent screen settings

### Frequent disconnections:
- Check network connectivity
- Verify Google API quotas
- Review browser console for errors

## Summary

This implementation provides a robust, multi-layered approach to handling OAuth token expiration in a client-side application. While not as secure as server-side OAuth, it significantly improves the user experience by maintaining continuous authentication through proactive token refresh.

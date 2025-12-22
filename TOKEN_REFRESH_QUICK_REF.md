# Token Refresh - Quick Reference

## ⏱️ Token Lifecycle

| Event | Time | Action |
|-------|------|--------|
| Sign In | 0:00 | Token valid for 1 hour |
| Periodic Check | Every 4 min | Check if refresh needed |
| Refresh Trigger | 55:00 | Token expires in 5 min → Auto refresh |
| Token Expiry | 60:00 | Token expired (but already refreshed) |

## 🔄 How Token Refresh Works

```
┌─────────────────────────────────────────────┐
│ 1. User Signs In                            │
│    → Token saved (expires in 3600s)         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 2. Background Monitor (Every 4 minutes)     │
│    → Check: Does token expire in < 5 min?   │
│    → If YES: Silent refresh                 │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 3. Before API Calls                         │
│    → Check token validity                   │
│    → Refresh if needed                      │
│    → Execute API call                       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ 4. On Error (401/403)                       │
│    → Try silent refresh                     │
│    → If fails: Show reconnect modal         │
└─────────────────────────────────────────────┘
```

## 🛡️ Three-Layer Protection

### Layer 1: Periodic Background Check
- **Frequency**: Every 4 minutes
- **Purpose**: Proactive refresh before expiry
- **Trigger**: Token expires in < 5 minutes

### Layer 2: Pre-Operation Check
- **When**: Before saving or fetching data
- **Purpose**: Ensure valid token for API calls
- **Action**: Refresh if needed, then proceed

### Layer 3: Error Recovery
- **When**: API call fails with 401/403
- **Purpose**: Last resort recovery
- **Action**: Try silent refresh, show modal if fails

## 📊 Console Logs to Watch

```bash
# On Sign In
✓ Token saved. Expires in 3600 seconds at 9:30:00 PM

# Periodic Check (every 4 min)
✓ Token check: Token valid

# When Token Expires Soon (< 5 min)
⚠ Token expiring soon, attempting proactive refresh...
✓ Attempting silent token refresh...
✓ Silent token refresh successful

# Before Save/Fetch
✓ Token validation successful

# On Expiry
⚠ Token expired, clearing...
```

## 🧪 Testing Checklist

- [ ] Sign in to Google Sheets
- [ ] Open DevTools Console
- [ ] Wait 4 minutes → See periodic check log
- [ ] Make a change → See pre-save check log
- [ ] Check localStorage → See token and expiry
- [ ] Wait 55 minutes → See automatic refresh
- [ ] Verify no disconnection after 1 hour

## 🔧 Configuration Values

```typescript
// In storageService.ts
REFRESH_BUFFER = 5 * 60 * 1000  // 5 minutes

// In App.tsx
PERIODIC_CHECK = 240000          // 4 minutes
POLL_INTERVAL = 30000            // 30 seconds
```

## 🐛 Debug Component (Optional)

Add to App.tsx for visual token monitoring:

```typescript
import { TokenStatus } from './components/TokenStatus';

// In render:
<TokenStatus isConnected={isGoogleConnected} />
```

Shows:
- ✅ Valid (green) - Token has > 5 min remaining
- ⚠️ Refreshing Soon (yellow) - Token expires in < 5 min
- ❌ Expired (red) - Token expired

## ⚡ Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Token keeps expiring | Check browser privacy settings, allow cookies |
| Silent refresh fails | User needs to manually reconnect |
| No refresh logs | Check if `isGoogleConnected` is true |
| Frequent refreshes | Adjust `REFRESH_BUFFER` timing |

## 📝 Key Functions

```typescript
// Check if token needs refresh
shouldRefreshToken(): boolean

// Get time remaining (seconds)
getTokenTimeRemaining(): number

// Ensure token is valid (auto-refresh)
ensureValidToken(): Promise<boolean>

// Manual silent refresh
trySilentAuth(): Promise<void>
```

## 🎯 Expected Behavior

**✅ Normal Flow:**
1. Sign in → Token valid for 1 hour
2. Work normally → Auto-save/fetch work seamlessly
3. After 55 min → Auto-refresh (transparent to user)
4. Continue working → No interruption

**❌ Error Flow:**
1. Token expires unexpectedly
2. API call fails → Auto-retry with refresh
3. If refresh fails → Show reconnect modal
4. User reconnects → Resume normal operation

## 📚 Documentation Files

- `TOKEN_REFRESH_GUIDE.md` - Comprehensive guide
- `TOKEN_REFRESH_SUMMARY.md` - Implementation summary
- `TOKEN_REFRESH_QUICK_REF.md` - This file

## ✨ Benefits

- ✅ No manual reconnection needed
- ✅ Seamless 24/7 operation
- ✅ Proactive error prevention
- ✅ Better user experience
- ✅ Detailed logging for debugging

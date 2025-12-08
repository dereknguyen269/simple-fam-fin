# Live Sync Implementation Guide

## Overview

The FamilyFinanceAI application now features robust **bi-directional Live Sync** functionality that automatically synchronizes data between the local browser storage and Google Sheets. This ensures your financial data is always up-to-date across all devices.

## Features

### 1. **Auto-Save on Change (Debounced)**
- **Debounce Time**: 2 seconds
- **Behavior**: Automatically saves changes to Google Sheets after you stop editing
- **Prevents**: Excessive API calls and race conditions
- **Retry Logic**: Automatically retries failed saves up to 3 times with exponential backoff
- **Conflict Prevention**: Uses a flag to prevent concurrent save operations

### 2. **Background Polling (Auto-Fetch)**
- **Poll Interval**: Every 30 seconds
- **Behavior**: Automatically fetches the latest data from Google Sheets
- **Health Checks**: Verifies authentication before each poll
- **Conflict Prevention**: Skips polling if a save is in progress
- **Smart Updates**: Only applies remote changes when user is not actively editing

### 3. **Sync Status Indicators**
The app displays real-time sync status in multiple locations:

#### Status Badge (Header)
- 🟢 **Live**: Successfully synced
- 🟡 **Saving...**: Currently saving changes
- 🔵 **Syncing...**: Fetching latest data
- 🔴 **Sync Error**: An error occurred (hover for details)

#### Sidebar Status
- Shows last sync time
- Displays error messages
- Provides "Refresh Data" button for manual sync

## Error Handling

### Authentication Errors
- **Detection**: Automatically detects expired sessions (401/403 errors)
- **Action**: Prompts user to reconnect
- **Recovery**: Stops polling and auto-save until reconnected

### Network Errors
- **Detection**: Identifies network-related failures
- **Action**: Automatically retries up to 3 times
- **Backoff**: Uses exponential backoff (3s, 6s, 9s)
- **User Feedback**: Shows "Network error. Will retry automatically."

### Configuration Errors
- **Missing Credentials**: "Missing configuration. Please provide all required fields."
- **Invalid Credentials**: "Invalid API credentials. Please check your Client ID and API Key."
- **Spreadsheet Not Found**: "Spreadsheet not found. Please check the Spreadsheet ID."
- **Access Denied**: "Access denied. Please check spreadsheet permissions."

## How It Works

### Initial Connection
1. User provides Google API credentials in Settings
2. App initializes Google API client
3. User authenticates via OAuth popup
4. App fetches existing data from Google Sheets
5. If sheet is empty, pushes local data
6. If sheet has data, overwrites local data
7. Starts auto-save and polling

### During Usage
1. **User makes a change** → Triggers auto-save timer (2s debounce)
2. **Timer expires** → Saves all data to Google Sheets
3. **Every 30 seconds** → Polls Google Sheets for updates
4. **Remote changes detected** → Updates local state
5. **Conflict detected** → Prioritizes local changes (discards remote during save)

### Disconnection
1. User clicks "Sign Out"
2. Revokes OAuth token
3. Stops polling
4. Clears sync status
5. Data remains in local storage

## Technical Implementation

### State Management
```typescript
const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'offline' | 'fetching'>('offline');
const [lastSynced, setLastSynced] = useState<Date | null>(null);
const [syncError, setSyncError] = useState<string | null>(null);
```

### Refs for Concurrency Control
```typescript
const isRemoteUpdate = useRef(false);      // Prevents triggering save on remote updates
const isSavingRef = useRef(false);         // Prevents concurrent saves
const syncStatusRef = useRef(syncStatus);  // Tracks status in async closures
const pollIntervalRef = useRef(null);      // Stores polling interval ID
const saveTimeoutRef = useRef(null);       // Stores debounce timeout ID
```

### Auto-Save Effect
- Monitors: `expenses`, `wallets`, `goals`, `budgets`, `categoryItems`, `memberItems`
- Saves to: Local storage (immediate) + Google Sheets (debounced)
- Cleanup: Clears timeout on unmount

### Polling Effect
- Monitors: `isGoogleConnected`, `googleConfig`
- Interval: 30 seconds
- Cleanup: Clears interval on unmount or disconnect

## Best Practices

### For Users
1. **Keep browser tab open** for automatic syncing
2. **Check sync status** before closing the app
3. **Reconnect if needed** when you see the yellow warning
4. **Use manual refresh** if you suspect data is out of sync

### For Developers
1. **Always use refs** for values accessed in async callbacks
2. **Check isSavingRef** before starting a save operation
3. **Set isRemoteUpdate** when applying remote changes
4. **Clear intervals/timeouts** in cleanup functions
5. **Handle all error types** with specific messages

## Troubleshooting

### "Authentication expired" Error
**Solution**: Click "Reconnect Sync" in the sidebar

### "Spreadsheet not found" Error
**Solution**: Verify the Spreadsheet ID in Settings

### "Access denied" Error
**Solution**: Ensure the spreadsheet is shared with your Google account

### Data not syncing
**Solution**: 
1. Check your internet connection
2. Verify you're still authenticated (check status badge)
3. Try manual refresh
4. Check browser console for errors

### Sync conflicts
**Solution**: The app prioritizes local changes during saves. If you need to force-fetch remote data, use the "Refresh Data" button.

## API Rate Limits

Google Sheets API has the following limits:
- **Read requests**: 100 per 100 seconds per user
- **Write requests**: 100 per 100 seconds per user

Our implementation stays well within these limits:
- **Auto-save**: Max 1 write per 2 seconds (30 writes/minute)
- **Polling**: 1 read per 30 seconds (2 reads/minute)

## Future Enhancements

Potential improvements for future versions:
1. **Conflict Resolution UI**: Show diff when conflicts detected
2. **Offline Queue**: Queue changes when offline, sync when back online
3. **Optimistic Updates**: Show changes immediately, sync in background
4. **Change History**: Track and display sync history
5. **Selective Sync**: Allow users to choose what to sync
6. **Real-time Sync**: Use WebSockets for instant updates (requires backend)

## Security Considerations

1. **OAuth 2.0**: Uses Google's secure authentication
2. **Client-side only**: No backend server to compromise
3. **Token storage**: Access tokens stored in memory only
4. **Scope limitation**: Only requests spreadsheet access
5. **User control**: Users can revoke access anytime

## Performance Optimization

1. **Debouncing**: Prevents excessive API calls
2. **Batch operations**: Saves all data types in parallel
3. **Conditional polling**: Skips polls during active saves
4. **Lazy loading**: Only fetches data when needed
5. **Local-first**: All operations work on local data first

---

**Last Updated**: December 7, 2025
**Version**: 2.0.0

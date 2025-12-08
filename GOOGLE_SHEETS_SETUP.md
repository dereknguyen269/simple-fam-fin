# Quick Start: Google Sheets Sync Setup

## Prerequisites
1. A Google account
2. A Google Sheets spreadsheet (can be empty)
3. Google Cloud Project with Sheets API enabled

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure OAuth consent screen (if not done):
   - User Type: External
   - App name: FamilyFinanceAI
   - User support email: Your email
   - Developer contact: Your email
4. Application type: **Web application**
5. Authorized JavaScript origins:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
6. Authorized redirect URIs:
   ```
   http://localhost:3001
   http://localhost:3000
   ```
7. Click "Create"
8. **Copy the Client ID** (you'll need this)

## Step 3: Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. **Copy the API Key** (you'll need this)
4. (Optional) Restrict the key to Google Sheets API only

## Step 4: Create or Prepare Google Sheet

1. Create a new Google Sheet or use an existing one
2. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
3. Make sure the sheet is accessible by your Google account

## Step 5: Configure FamilyFinanceAI

1. Open FamilyFinanceAI in your browser
2. Click **Settings** in the sidebar
3. Scroll to **Google Sheets Sync** section
4. Enter your credentials:
   - **Client ID**: Paste from Step 2
   - **API Key**: Paste from Step 3
   - **Spreadsheet ID**: Paste from Step 4
5. Click **Connect to Google Sheets**
6. Sign in with your Google account when prompted
7. Grant permissions to access Google Sheets

## Step 6: Verify Connection

✅ **Success indicators**:
- Status badge shows "Live" (green)
- Sidebar shows "Synced: [time]"
- No error messages

❌ **Common issues**:

### "Invalid API credentials"
- Double-check Client ID and API Key
- Ensure no extra spaces when copying

### "Spreadsheet not found"
- Verify Spreadsheet ID is correct
- Ensure sheet exists and is not deleted

### "Access denied"
- Make sure you're signed in with the correct Google account
- Check that the sheet is accessible by your account

### "Google API failed to load"
- Check your internet connection
- Disable ad blockers or privacy extensions
- Try a different browser

## Understanding Sync Behavior

### When you first connect:
- **If sheet is empty**: Your local data will be pushed to the sheet
- **If sheet has data**: Sheet data will overwrite your local data

### During usage:
- **Auto-save**: Changes are saved automatically after 2 seconds of inactivity
- **Auto-fetch**: Latest data is fetched every 30 seconds
- **Status**: Watch the status badge in the header for sync state

## Testing the Connection

1. Add a new expense in the app
2. Wait 2 seconds (watch for "Saving..." status)
3. Open your Google Sheet in another tab
4. Verify the expense appears in the sheet
5. Edit the expense in the sheet
6. Wait 30 seconds or click "Refresh Data"
7. Verify the change appears in the app

## Disconnecting

To disconnect from Google Sheets:
1. Click **Settings**
2. Scroll to **Google Sheets Sync**
3. Click **Sign Out**

Your local data will remain intact.

## Security Notes

- ✅ Your credentials are stored locally in your browser
- ✅ No data is sent to any server except Google
- ✅ You can revoke access anytime from [Google Account Settings](https://myaccount.google.com/permissions)
- ✅ OAuth tokens expire automatically for security

## Need Help?

- Check the [Live Sync Guide](./LIVE_SYNC_GUIDE.md) for detailed documentation
- Open browser console (F12) to see detailed error messages
- Verify all credentials are correct
- Try disconnecting and reconnecting

---

**Pro Tip**: Keep the app open in a browser tab for continuous syncing. The app will automatically sync changes even when you're not actively using it!

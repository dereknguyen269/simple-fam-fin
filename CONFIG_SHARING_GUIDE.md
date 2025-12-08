# Data Source Configuration Sharing Guide

## Overview

The FamilyFinanceAI app now supports **easy sharing and importing** of Google Sheets Data Source configurations. This makes it simple to set up the app for multiple family members or across different devices.

## Features

### 1. **Export Configuration** 📥
Export your Google API credentials to a JSON file for backup or sharing.

**How to use:**
1. Open **Settings** → **Data Source**
2. Fill in your Google credentials (Client ID, API Key, Spreadsheet ID)
3. Click **Export** button
4. Save the JSON file to your computer

**File format:**
```json
{
  "version": "1.0",
  "timestamp": "2025-12-07T14:00:00.000Z",
  "config": {
    "clientId": "your-client-id.apps.googleusercontent.com",
    "apiKey": "your-api-key",
    "spreadsheetId": "your-spreadsheet-id"
  }
}
```

### 2. **Import Configuration** 📤
Import a previously exported configuration file.

**How to use:**
1. Open **Settings** → **Data Source**
2. Click **Import** button
3. Select the JSON file
4. Review the imported values
5. Click **Save Changes** to apply

**Use cases:**
- Set up the app on a new device
- Restore configuration after clearing browser data
- Share configuration with family members (via file)

### 3. **Share Configuration Link** 🔗
Generate a shareable URL that contains your configuration.

**How to use:**
1. Open **Settings** → **Data Source**
2. Fill in your Google credentials
3. Click **Share** button
4. Link is automatically copied to clipboard
5. Send the link to family members

**How it works:**
- Configuration is encoded in the URL
- When someone opens the link, they're prompted to import
- URL is automatically cleaned after import

**Example link:**
```
http://localhost:3001/?config=eyJjbGllbnRJZCI6Ii4uLiJ9
```

### 4. **Download CSV Template** 📊
Download a CSV template for manual Google Sheets setup.

**How to use:**
1. Click **Template** button
2. Open the downloaded CSV in Excel/Google Sheets
3. Use as reference for sheet structure

## Security Considerations

### ⚠️ Important Security Notes

1. **API Keys are sensitive**
   - Treat exported JSON files like passwords
   - Don't share publicly or commit to version control
   - Only share with trusted family members

2. **Shared links contain credentials**
   - Links include your API credentials
   - Only send via secure channels (encrypted messaging)
   - Links are single-use (URL is cleaned after import)

3. **Spreadsheet access**
   - Anyone with your configuration can access your spreadsheet
   - Ensure spreadsheet permissions are set correctly
   - Consider using a family-specific Google account

### ✅ Best Practices

1. **For family sharing:**
   - Use the **Share** button to generate a link
   - Send via WhatsApp, Signal, or other encrypted messaging
   - Recipient clicks link and confirms import
   - Link becomes invalid after use

2. **For personal backup:**
   - Use the **Export** button to save JSON file
   - Store in a secure location (password manager, encrypted drive)
   - Use **Import** to restore on new device

3. **For team collaboration:**
   - Create a shared Google Cloud project
   - Use the same credentials for all team members
   - Share the same spreadsheet
   - Everyone uses **Import** or **Share** link

## Workflow Examples

### Example 1: Setting Up Family Members

**Parent (already configured):**
1. Open Settings → Data Source
2. Click **Share** button
3. Send link to family member via WhatsApp

**Family Member (new user):**
1. Click the shared link
2. Confirm "Import configuration?"
3. Click "Save Changes" in Settings
4. Grant Google permissions
5. ✅ Connected to same spreadsheet!

### Example 2: Switching Devices

**On old device:**
1. Open Settings → Data Source
2. Click **Export** button
3. Save JSON file to cloud storage (Google Drive, Dropbox)

**On new device:**
1. Download JSON file from cloud storage
2. Open Settings → Data Source
3. Click **Import** button
4. Select the JSON file
5. Click "Save Changes"
6. ✅ Same configuration restored!

### Example 3: Backup Before Reset

**Before clearing browser data:**
1. Open Settings → Data Source
2. Click **Export** button
3. Save JSON file to safe location

**After clearing browser data:**
1. Open app (will show setup wizard)
2. Skip setup or complete it
3. Open Settings → Data Source
4. Click **Import** button
5. Select saved JSON file
6. ✅ Configuration restored!

## Troubleshooting

### "Invalid configuration file format"
**Cause:** JSON file is corrupted or wrong format
**Solution:** 
- Ensure file was exported from this app
- Check file wasn't edited manually
- Try exporting again from original device

### "Failed to parse configuration file"
**Cause:** File is not valid JSON
**Solution:**
- Don't edit the JSON file manually
- Re-export from source
- Ensure file wasn't corrupted during transfer

### Shared link doesn't work
**Cause:** Link was truncated or modified
**Solution:**
- Copy the entire link
- Send via messaging app (not SMS which may truncate)
- Try **Export** → **Import** method instead

### Configuration imports but connection fails
**Cause:** Credentials are invalid or expired
**Solution:**
- Verify credentials in Google Cloud Console
- Check API Key hasn't been restricted
- Ensure OAuth Client ID is still active
- Try reconnecting manually

## File Management

### Exported File Naming
Files are automatically named with date:
```
familyfinance-config-2025-12-07.json
```

### Storage Recommendations

**✅ Good places to store:**
- Password manager (1Password, LastPass, Bitwarden)
- Encrypted cloud storage (Google Drive, Dropbox with encryption)
- Secure notes app
- Local encrypted folder

**❌ Avoid storing:**
- Public cloud folders
- Unencrypted email
- Public GitHub repositories
- Shared network drives
- Plain text files on desktop

## Advanced Usage

### Programmatic Import

You can also import configuration programmatically:

```javascript
// Read configuration from file
const configData = {
  config: {
    clientId: "your-client-id",
    apiKey: "your-api-key",
    spreadsheetId: "your-spreadsheet-id"
  }
};

// Save to localStorage
localStorage.setItem('family_finance_google_config', JSON.stringify(configData.config));

// Reload app
window.location.reload();
```

### Bulk Setup Script

For IT administrators setting up multiple devices:

```bash
#!/bin/bash
# Download config file to each device
curl -o config.json https://your-secure-server/config.json

# Open app with import prompt
open "http://localhost:3001"
# User clicks Import and selects config.json
```

## Privacy & Data Protection

### What's Shared

When you export or share configuration:
- ✅ Google Cloud Client ID
- ✅ Google API Key
- ✅ Spreadsheet ID

### What's NOT Shared

- ❌ Your actual financial data
- ❌ OAuth tokens
- ❌ Transaction history
- ❌ Personal information
- ❌ Browser data

### Data Flow

```
Export → JSON File → Share → Import → Save → Connect → Access Spreadsheet
```

All data stays between:
1. Your browser (local storage)
2. Your Google Sheet (cloud storage)
3. Google's servers (OAuth authentication)

**No third-party servers involved!**

## FAQ

**Q: Can I share my configuration with anyone?**
A: Only share with people you trust to access your financial spreadsheet.

**Q: Will they see my existing data?**
A: Yes, if they connect to the same spreadsheet, they'll see all data in it.

**Q: Can I use different spreadsheets for different family members?**
A: Yes, just use different Spreadsheet IDs for each person.

**Q: Is the shared link permanent?**
A: No, it's designed for one-time use. The URL is cleaned after import.

**Q: Can I revoke access after sharing?**
A: Yes, change your API credentials in Google Cloud Console.

**Q: What if someone loses the configuration file?**
A: You can export again and share a new file or link.

---

**Last Updated**: December 7, 2025
**Version**: 2.2.0

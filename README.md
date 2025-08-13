# Kick Stream Filter - Chrome Extension

A Chrome extension to filter Kick.com streams by streamer name, stream title, and category (game).

## Features

- **Filter by Streamer Name**: Hide streams from specific streamers
- **Filter by Stream Title**: Hide streams containing specific keywords in their titles
- **Filter by Category/Game**: Hide streams from specific games or categories
- **Toggle On/Off**: Easily enable or disable filtering
- **Persistent Filters**: Your filters are saved and remembered
- **Import/Export Backup**: 
  - Export your filters to a timestamped JSON file for backup
  - Import filters from a backup file (choose to replace or merge with existing filters)
  - Never lose your filter configurations

## Installation

1. **Generate Icons**:
   - Open `create-icons.html` in your browser
   - Click each download button to save the icon files (icon-16.png, icon-48.png, icon-128.png)
   - Make sure the icon files are in the same folder as manifest.json

2. **Load the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing this extension

3. **Use the Extension**:
   - Navigate to kick.com
   - Click the extension icon in your toolbar
   - Add filters for streamers, titles, or categories
   - The streams matching your filters will be hidden automatically
   - Use "Export Filters" to backup your configuration
   - Use "Import Filters" to restore from a backup

## How It Works

The extension looks for stream cards on Kick.com and extracts:
- **Streamer name** from profile links
- **Stream title** from the title attribute
- **Category** from category links

When any of these match your filters (case-insensitive partial match), the entire stream card is hidden.

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Filter management UI
- `popup.js` - Popup functionality
- `content.js` - Content script that performs the filtering
- `create-icons.html` - Helper to generate icon files

## Notes

- Filters are case-insensitive
- Partial matches work (e.g., "knight" will match "Knight's Quest")
- The extension only works on kick.com
- Filters are applied automatically when the page updates
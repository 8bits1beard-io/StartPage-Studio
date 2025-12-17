# Landing Page Studio

**Author:** Joshua Walderbach

> Design branded landing pages for kiosks and curated user experiences. Visual editor with live preview and enterprise deployment.

## Features

- **Visual Editor** - Configure your landing page without writing code
- **Tabbed Interface** - Organized configuration in Page, Theme, Links, and Export tabs
- **Live Preview** - See changes in real-time as you edit
- **Auto-Save** - Your work is automatically saved to browser storage
- **Dual Logo Support** - Main logo above greeting, small logo with flexible corner/greeting positioning
- **SVG Upload** - Upload SVG files or reference hosted logos
- **Color Themes** - 20 preset WCAG-compliant themes plus custom colors
- **Drag-and-Drop** - Reorder groups and links by dragging
- **Local App Shortcuts** - Create .lnk shortcuts for local applications
- **Auto-Redirect** - Optionally redirect to another page after a delay
- **Import/Export** - Import previously created landing pages for editing
- **WCAG Compliant** - Generated pages meet accessibility standards
- **Enterprise Ready** - PowerShell scripts for Intune/SCCM deployment

## Quick Start

1. **Open** `index.html` in any modern browser
2. **Configure** your page settings, colors, and links
3. **Preview** changes in real-time on the right panel
4. **Download** the PowerShell script or standalone HTML

## Configuration

### Page Settings

| Setting | Description |
|---------|-------------|
| Page Title | Browser tab text |
| Greeting | Main heading (e.g., "Welcome") |
| Main Logo | Logo displayed above the greeting (upload SVG or enter URL) |
| Small Logo | Secondary logo with flexible positioning (corner or beside greeting) |
| Computer Name | Toggle display and position |
| Date/Time | Optional live clock (ISO 8601) |
| Footer | Optional footer text |
| Auto-Redirect | Redirect to another URL after specified seconds |
| Script Name | Name used in the PowerShell script filename |
| Destination Path | Where the landing page saves |

### Color Themes

Choose from 20 preset themes or create custom colors:

**Walmart** · **Sunset** · **Violet** · **Slate** · **Forest** · **Ocean** · **Crimson** · **Monochrome** · **Berry** · **Midnight** · **Teal** · **Coffee** · **Steel** · **Winter** · **Spring** · **Summer** · **Independence** · **Halloween** · **Synthwave** · **Corporate**

### Links

- **Add Group** - Create categorized link sections with optional icons
- **Add Link** - Add links to a group or as standalone (ungrouped)
- **Web Links** - Standard URLs that open in the browser
- **App Links** - Local application paths that generate .lnk shortcuts
- **Drag handles** - Use ⋮⋮ (groups) or ⋮ (links) to reorder

## Download Options

| Option | Use Case |
|--------|----------|
| **PowerShell Script** | Enterprise deployment via Intune/SCCM. Filename: `Generate-LandingPage_[ScriptName].ps1`. Captures computer name at runtime. Creates .lnk shortcuts for any app links. |
| **HTML Only** | Local testing. Computer name shows as placeholder. |
| **Import Landing Page** | Load a previously generated landing page to edit. |
| **Reset Everything** | Clear all settings and start fresh. |

See [DEPLOYMENT.md](DEPLOYMENT.md) for enterprise deployment instructions.

## Browser Support

Edge, Chrome, Firefox, Safari

## Files

| File | Purpose |
|------|---------|
| `index.html` | Landing Page Studio application |
| `styles.css` | Application styles |
| `app.js` | Application logic |
| `README.md` | This documentation |
| `DEPLOYMENT.md` | Enterprise deployment guide |
| `CONTRIBUTING.md` | Developer documentation |

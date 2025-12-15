# StartPage Studio

**Author:** Joshua Walderbach

> Design branded landing pages for kiosks and curated user experiences. Visual editor with live preview and enterprise deployment.

## Features

- **Visual Editor** - Configure your landing page without writing code
- **Live Preview** - See changes in real-time as you edit
- **Auto-Save** - Your work is automatically saved to browser storage
- **Color Themes** - 8 preset WCAG-compliant themes plus custom colors
- **Drag-and-Drop** - Reorder groups and links by dragging
- **Windows App Links** - Quick-add links to Settings, Calculator, Teams, and more
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
| Computer Name | Toggle display and position |
| Date/Time | Optional live clock (ISO 8601) |
| Logo URL | Optional organization logo |
| Footer | Optional footer text |
| Destination Path | Where the landing page saves |

### Color Themes

Choose from 8 preset themes or create custom colors:

**Walmart** · **Sunset** · **Violet** · **Slate** · **Forest** · **Ocean** · **Crimson** · **Monochrome**

Selecting Walmart auto-populates the Spark logo.

### Links

- **Add Group** - Create categorized link sections
- **Add Link** - Add links to a group or ungrouped
- **Drag handles** - Use ⋮⋮ (groups) or ⋮ (links) to reorder
- **Windows App dropdown** - Quick-add system settings and built-in apps

## Download Options

| Option | Use Case |
|--------|----------|
| **PowerShell Script** | Enterprise deployment via Intune/SCCM. Captures computer name at runtime. |
| **HTML Only** | Local testing. Computer name shows as placeholder. |

See [DEPLOYMENT.md](DEPLOYMENT.md) for enterprise deployment instructions.

## Browser Support

Edge, Chrome, Firefox, Safari

## Files

| File | Purpose |
|------|---------|
| `index.html` | StartPage Studio application |
| `README.md` | This documentation |
| `DEPLOYMENT.md` | Enterprise deployment guide |
| `CONTRIBUTING.md` | Developer documentation |

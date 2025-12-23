# Contributing

This guide covers the codebase structure for developers who want to modify StartPage Studio.

## Architecture

StartPage Studio is a static app with no build step. Structure is split across `index.html` (markup), `styles.css` (styles), and `app.js` (logic), with no external dependencies.

### Key Code Sections

| Section | Location | Purpose |
|---------|----------|---------|
| CSS Variables | `styles.css` `:root` block | Editor theming |
| State Management | ~line 1041 | `groups`, `ungroupedLinks`, `selectedTheme`, `customColors` |
| Theme System | ~line 1086 | `themes` object, `getActiveColors()`, `renderThemeSwatches()` |
| Group/Link CRUD | ~line 1436 | `addGroup()`, `removeGroup()`, `addLinkToGroup()`, etc. |
| DOM Rendering | ~line 1654 | `renderGroups()`, `renderUngroupedLinks()` |
| Output Generation | ~line 1757 | `generateHTML()`, `generatePowerShellScript()` |
| Download Handlers | ~line 2321 | `downloadScript()`, `downloadHTML()` |

### State Structure

```javascript
groups = [{ id, name, links: [{ id, name, url }] }]
ungroupedLinks = [{ id, name, url }]
selectedTheme = 'walmart' | 'sunset' | 'violet' | ... | 'custom'
customColors = { primary: '#hex', accent: '#hex' }
```

### Data Flow

User edits → state updates → `renderGroups()`/`renderUngroupedLinks()` → `updatePreview()` → iframe refresh via `srcdoc`

## Customization

To modify StartPage Studio:

- **Editor colors** - Edit CSS variables in the `:root` block
- **Theme presets** - Modify the `themes` object to add/change color themes
- **Default content** - Edit the `init()` function to change example groups/links
- **Output template** - Modify `generateHTML()` to change the landing page structure
- **PowerShell output** - Edit `generatePowerShellScript()` to change paths or logging

## Accessibility

Both StartPage Studio and generated landing pages target WCAG 2.1 AA compliance.

### StartPage Studio Accessibility

| Feature | Implementation |
|---------|----------------|
| Skip link | Keyboard shortcut to bypass navigation |
| Semantic HTML | Proper heading hierarchy (`h1` > `h2` > `h3`) |
| ARIA labels | All form controls have accessible names |
| Live regions | Screen reader announcements via `aria-live` |
| Focus indicators | Visible outlines on all interactive elements |
| High contrast | `prefers-contrast: high` media query support |
| Reduced motion | `prefers-reduced-motion` media query support |
| Keyboard navigation | Full Tab/Shift+Tab/Enter support |

### Generated Landing Page Accessibility

| Feature | Implementation |
|---------|----------------|
| Skip link | Jump to main content |
| ARIA labels | Semantic landmarks and labels |
| Focus indicators | High-visibility focus rings |
| Touch targets | Minimum 44px hit areas |
| High contrast | Border reinforcement in high contrast mode |
| Reduced motion | Transitions disabled when preferred |

### Theme Contrast

All 8 preset themes are verified for WCAG AA contrast ratios. Custom colors display a warning since contrast is not validated.

## Testing Generated Output

1. Download the PowerShell script from StartPage Studio
2. Run as administrator:
   ```
   powershell -ExecutionPolicy Bypass -File "Generate-StartPage.ps1"
   ```
3. Output goes to your configured destination path (default: `C:\ProgramData\StartPage\index.html`)

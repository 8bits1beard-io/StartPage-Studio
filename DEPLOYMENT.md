# Deployment Guide

This guide covers deploying Landing Page Studio landing pages in enterprise environments.

## Output Files

### Generate-LandingPage_[Name].ps1

The downloaded PowerShell script (where `[Name]` is your configured script name):
- Reads the device's computer name from Windows
- Creates the landing page at your configured destination path (default: `C:\ProgramData\LandingPage\index.html`)
- Creates .lnk shortcuts for any app links in the same folder as the landing page
- Logs to a `Logs` subfolder in the destination directory

### index.html

The generated landing page includes:
- Your selected color theme
- Responsive design for all screen sizes
- WCAG accessibility features
- All styling inline (no external dependencies)

### App Shortcuts (.lnk files)

When you create links with type "App" (for local applications), the PowerShell script generates Windows shortcut files (.lnk) in the same directory as the landing page. The landing page links to these shortcuts, allowing users to launch local applications directly from the browser.

## Local Testing

1. Download the PowerShell script from Landing Page Studio
2. Open Command Prompt as Administrator
3. Run:
   ```
   powershell -ExecutionPolicy Bypass -File "Generate-LandingPage_MyLandingPage.ps1"
   ```
4. Open your configured destination path in a browser (default: `C:\ProgramData\LandingPage\index.html`)

## Microsoft Intune

1. Create a folder containing your `Generate-LandingPage_[Name].ps1` script
2. Use the [Win32 Content Prep Tool](https://github.com/Microsoft/Microsoft-Win32-Content-Prep-Tool) to create an `.intunewin` file
3. In Intune admin center, create a Win32 app:

| Field | Value |
|-------|-------|
| Install command | `powershell -ExecutionPolicy Bypass -File "Generate-LandingPage_[Name].ps1"` |
| Uninstall command | `cmd /c del "<your-destination-path>"` |
| Detection | File exists: `<your-destination-path>` |

*Replace `[Name]` with your script name and `<your-destination-path>` with your configured destination path.*

## SCCM / ConfigMgr

1. Copy `Generate-LandingPage_[Name].ps1` to a network share
2. Create a Package or Application:

| Field | Value |
|-------|-------|
| Command line | `powershell -ExecutionPolicy Bypass -File "Generate-LandingPage_[Name].ps1"` |
| Run | Hidden |
| Run mode | Run with administrative rights |

## Setting as Browser Homepage

To use the generated page as the browser start page, set the homepage URL to:

```
file:///C:/ProgramData/LandingPage/index.html
```

Adjust the path if you configured a different destination.

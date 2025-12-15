# Deployment Guide

This guide covers deploying StartPage Studio landing pages in enterprise environments.

## Output Files

### Generate-StartPage.ps1

The downloaded PowerShell script:
- Reads the device's computer name from Windows
- Creates the landing page at your configured destination path (default: `C:\ProgramData\StartPage\index.html`)
- Logs to a `Logs` subfolder in the destination directory

### index.html

The generated landing page includes:
- Your selected color theme
- Responsive design for all screen sizes
- WCAG accessibility features
- All styling inline (no external dependencies)

## Local Testing

1. Download the PowerShell script from StartPage Studio
2. Open Command Prompt as Administrator
3. Run:
   ```
   powershell -ExecutionPolicy Bypass -File "Generate-StartPage.ps1"
   ```
4. Open your configured destination path in a browser (default: `C:\ProgramData\StartPage\index.html`)

## Microsoft Intune

1. Create a folder containing `Generate-StartPage.ps1`
2. Use the [Win32 Content Prep Tool](https://github.com/Microsoft/Microsoft-Win32-Content-Prep-Tool) to create an `.intunewin` file
3. In Intune admin center, create a Win32 app:

| Field | Value |
|-------|-------|
| Install command | `powershell -ExecutionPolicy Bypass -File "Generate-StartPage.ps1"` |
| Uninstall command | `cmd /c del "<your-destination-path>"` |
| Detection | File exists: `<your-destination-path>` |

*Replace `<your-destination-path>` with your configured destination path.*

## SCCM / ConfigMgr

1. Copy `Generate-StartPage.ps1` to a network share
2. Create a Package or Application:

| Field | Value |
|-------|-------|
| Command line | `powershell -ExecutionPolicy Bypass -File "Generate-StartPage.ps1"` |
| Run | Hidden |
| Run mode | Run with administrative rights |

## Setting as Browser Homepage

To use the generated page as the browser start page, set the homepage URL to:

```
file:///C:/ProgramData/StartPage/index.html
```

Adjust the path if you configured a different destination.

# Repository Guidelines

## Project Structure & Module Organization

- `index.html` holds the app shell and editor markup.
- `styles.css` defines the UI theme, layout, and component styles.
- `app.js` contains state management, rendering, and export logic.
- Docs live in `README.md`, `CONTRIBUTING.md`, and `DEPLOYMENT.md`.

## Build, Test, and Development Commands

- No build step is required. Open `index.html` in a modern browser.
- Optional static server for local testing:
  - `python -m http.server` then visit `http://localhost:8000`.

## Coding Style & Naming Conventions

- Indentation: 4 spaces across HTML, CSS, and JavaScript.
- JavaScript uses `const`/`let`, camelCase for functions/variables, and UPPER_SNAKE_CASE for constants (e.g., `DEFAULTS`).
- CSS class names are kebab-case (e.g., `.tab-nav`, `.save-indicator`).

## Testing Guidelines

- There is no automated test suite.
- Manual checks: open the editor, modify settings, and verify preview and export.
- Generated output validation (PowerShell):  
  `powershell -ExecutionPolicy Bypass -File "Generate-StartPage.ps1"`  
  Confirm the file is written to the configured destination path.

## Commit & Pull Request Guidelines

- Commit messages in history use short, imperative subjects (e.g., “Add …”, “Fix …”).
- Keep commits focused and describe the user-facing change.
- PRs should include a concise summary and screenshots for UI changes; link related issues when applicable.

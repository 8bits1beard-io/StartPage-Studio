// Default values
const DEFAULTS = {
    theme: 'monochrome',
    customColors: { primary: '#0053E2', accent: '#FFC220' },
    pageTitle: 'Quick Links',
    greeting: 'Welcome',
    computerNamePosition: 'top-right',
    dateTimeFormat: 'both',
    dateTimePosition: 'top-left',
    sideLogoPosition: 'left',
    autoRefreshDelay: '30',
    destinationPath: 'C:\\ProgramData\\LandingPage\\index.html',
    scriptName: 'MyLandingPage'
};

// State management
let groups = [];
let ungroupedLinks = [];
let groupIdCounter = 0;
let linkIdCounter = 0;
let saveIndicatorTimeout = null;
let debounceTimer = null;
let modalTriggerElement = null;

// Debounced update preview for input events
function debouncedUpdatePreview() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 150);
}

// Tab switching
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        const isActive = btn.getAttribute('aria-controls') === 'tab-' + tabName;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive);
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === 'tab-' + tabName);
    });
}

// Arrow key navigation for tabs
function handleTabKeydown(event) {
    const tabs = ['page', 'theme', 'links', 'export'];
    const currentTab = event.target.getAttribute('aria-controls').replace('tab-', '');
    const currentIndex = tabs.indexOf(currentTab);
    let newIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
        event.preventDefault();
        newIndex = 0;
    } else if (event.key === 'End') {
        event.preventDefault();
        newIndex = tabs.length - 1;
    } else {
        return;
    }

    switchTab(tabs[newIndex]);
    document.querySelector(`[aria-controls="tab-${tabs[newIndex]}"]`).focus();
}

// Validate that no two elements share the same corner position
function validatePositions() {
    const positions = [];
    const warnings = {
        computerName: document.getElementById('computerNamePositionWarning'),
        dateTime: document.getElementById('dateTimePositionWarning'),
        sideLogo: document.getElementById('sideLogoPositionWarning')
    };

    // Hide all warnings initially
    Object.values(warnings).forEach(w => { if (w) w.style.display = 'none'; });

    // Collect active corner positions (not 'left', 'right', or 'footer')
    const cornerPositions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];

    // Check computer name position
    const showComputerName = document.getElementById('showComputerName').checked;
    const computerNamePos = document.getElementById('computerNamePosition').value;
    if (showComputerName && cornerPositions.includes(computerNamePos)) {
        positions.push({ element: 'computerName', position: computerNamePos });
    }

    // Check date/time position
    const showDateTime = document.getElementById('showDateTime').checked;
    const dateTimePos = document.getElementById('dateTimePosition').value;
    if (showDateTime && cornerPositions.includes(dateTimePos)) {
        positions.push({ element: 'dateTime', position: dateTimePos });
    }

    // Check side logo position
    const sideLogoUrl = document.getElementById('sideLogoUrl').value;
    const sideLogoPos = document.getElementById('sideLogoPosition').value;
    if (sideLogoUrl && cornerPositions.includes(sideLogoPos)) {
        positions.push({ element: 'sideLogo', position: sideLogoPos });
    }

    // Find conflicts
    const positionCounts = {};
    positions.forEach(p => {
        positionCounts[p.position] = positionCounts[p.position] || [];
        positionCounts[p.position].push(p.element);
    });

    // Show warnings for conflicts
    let hasConflicts = false;
    Object.entries(positionCounts).forEach(([pos, elements]) => {
        if (elements.length > 1) {
            hasConflicts = true;
            elements.forEach(el => {
                if (warnings[el]) warnings[el].style.display = 'block';
            });
        }
    });

    return !hasConflicts;
}

// Theme presets (all WCAG AA verified)
const themes = {
    walmart: { name: 'Walmart', primary: '#0053E2', accent: '#FFC220' },
    sunset: { name: 'Sunset', primary: '#9a3412', accent: '#fbbf24' },
    violet: { name: 'Violet', primary: '#5b21b6', accent: '#c4b5fd' },
    slate: { name: 'Slate', primary: '#1e293b', accent: '#f59e0b' },
    forest: { name: 'Forest', primary: '#166534', accent: '#fbbf24' },
    ocean: { name: 'Ocean', primary: '#0369a1', accent: '#06b6d4' },
    crimson: { name: 'Crimson', primary: '#991b1b', accent: '#fbbf24' },
    monochrome: { name: 'Monochrome', primary: '#171717', accent: '#a3a3a3' },
    berry: { name: 'Berry', primary: '#831843', accent: '#f9a8d4' },
    midnight: { name: 'Midnight', primary: '#312e81', accent: '#fcd34d' },
    teal: { name: 'Teal', primary: '#115e59', accent: '#fb923c' },
    coffee: { name: 'Coffee', primary: '#78350f', accent: '#fef3c7' },
    steel: { name: 'Steel', primary: '#475569', accent: '#a3e635' },
    winter: { name: 'Winter', primary: '#1e40af', accent: '#bfdbfe' },
    spring: { name: 'Spring', primary: '#15803d', accent: '#fbcfe8' },
    summer: { name: 'Summer', primary: '#a16207', accent: '#fde047' },
    independence: { name: 'Independence', primary: '#1e3a8a', accent: '#dc2626' },
    halloween: { name: 'Halloween', primary: '#431407', accent: '#fb923c' },
    synthwave: { name: 'Synthwave', primary: '#be185d', accent: '#22d3ee' },
    corporate: { name: 'Corporate', primary: '#1e3a8a', accent: '#9ca3af' }
};
let selectedTheme = DEFAULTS.theme;
let customColors = { ...DEFAULTS.customColors };

// Get active colors based on selected theme
function getActiveColors() {
    if (selectedTheme === 'custom') {
        return customColors;
    }
    return themes[selectedTheme];
}

// Render theme swatches
function renderThemeSwatches() {
    const container = document.getElementById('themeSwatches');
    let html = '';

    // Render preset theme swatches
    for (const [key, theme] of Object.entries(themes)) {
        const isSelected = selectedTheme === key;
        html += `
            <div class="swatch-container">
                <button type="button"
                        class="theme-swatch ${isSelected ? 'selected' : ''}"
                        onclick="selectTheme('${key}')"
                        role="radio"
                        aria-checked="${isSelected}"
                        aria-label="${theme.name} theme"
                        title="${theme.name}">
                    <div class="swatch-primary" style="background-color: ${theme.primary};"></div>
                    <div class="swatch-accent" style="background-color: ${theme.accent};"></div>
                </button>
                <span class="swatch-label">${theme.name}</span>
            </div>
        `;
    }

    // Add custom swatch
    const isCustomSelected = selectedTheme === 'custom';
    html += `
        <div class="swatch-container">
            <button type="button"
                    class="theme-swatch theme-swatch-custom ${isCustomSelected ? 'selected' : ''}"
                    onclick="selectTheme('custom')"
                    role="radio"
                    aria-checked="${isCustomSelected}"
                    aria-label="Custom theme"
                    title="Custom colors">
            </button>
            <span class="swatch-label">Custom</span>
        </div>
    `;

    container.innerHTML = html;

    // Show/hide custom colors section
    const customColorsSection = document.getElementById('customColors');
    const customWarning = document.getElementById('customWarning');
    if (isCustomSelected) {
        customColorsSection.classList.add('visible');
        customWarning.classList.add('visible');
    } else {
        customColorsSection.classList.remove('visible');
        customWarning.classList.remove('visible');
    }
}

// Select a theme
function selectTheme(themeKey) {
    selectedTheme = themeKey;
    renderThemeSwatches();
    updatePreview();
    const themeName = themeKey === 'custom' ? 'Custom' : themes[themeKey].name;
    announce(`${themeName} theme selected`);
}

// Sync color input from color picker
function syncColorInput(colorType, value) {
    customColors[colorType] = value;
    document.getElementById(`custom${colorType.charAt(0).toUpperCase() + colorType.slice(1)}`).value = value;
    updatePreview();
}

// Sync color picker from text input
function syncColorPicker(colorType, value) {
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        customColors[colorType] = value;
        document.getElementById(`custom${colorType.charAt(0).toUpperCase() + colorType.slice(1)}Picker`).value = value;
        updatePreview();
    }
}

// Handle logo SVG file upload
function handleLogoUpload(logoType, input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.includes('svg')) {
        alert('Please upload an SVG file.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const svgContent = e.target.result;
        const dataUri = 'data:image/svg+xml,' + encodeURIComponent(svgContent);
        const inputId = logoType === 'top' ? 'topLogoUrl' : 'sideLogoUrl';
        document.getElementById(inputId).value = dataUri;
        updatePreview();
        announce(`${logoType === 'top' ? 'Top' : 'Side'} logo uploaded`);
    };
    reader.readAsText(file);
    input.value = ''; // Reset file input
}

// Clear logo
function clearLogo(logoType) {
    const inputId = logoType === 'top' ? 'topLogoUrl' : 'sideLogoUrl';
    document.getElementById(inputId).value = '';
    updatePreview();
    announce(`${logoType === 'top' ? 'Top' : 'Side'} logo cleared`);
}

// Update group icon
function updateGroupIcon(groupId, value) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.icon = value;
        updatePreview();
    }
}

// Handle group icon SVG upload
function handleGroupIconUpload(groupId, input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.includes('svg')) {
        alert('Please upload an SVG file.');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const svgContent = e.target.result;
        const dataUri = 'data:image/svg+xml,' + encodeURIComponent(svgContent);
        const group = groups.find(g => g.id === groupId);
        if (group) {
            group.icon = dataUri;
            document.getElementById(`group-icon-${groupId}`).value = dataUri;
            updatePreview();
            announce('Group icon uploaded');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// Clear group icon
function clearGroupIcon(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.icon = '';
        document.getElementById(`group-icon-${groupId}`).value = '';
        updatePreview();
        announce('Group icon cleared');
    }
}

// Announce to screen readers
function announce(message) {
    const announcer = document.getElementById('sr-announcements');
    announcer.textContent = message;
    // Clear after announcement
    setTimeout(() => { announcer.textContent = ''; }, 1000);
}

// Toggle collapsible section
function toggleSection(sectionId) {
    const header = document.getElementById(`${sectionId}-header`);
    const content = document.getElementById(`${sectionId}-content`);
    if (header && content) {
        header.classList.toggle('collapsed');
        content.classList.toggle('collapsed');
        const isCollapsed = content.classList.contains('collapsed');
        header.setAttribute('aria-expanded', !isCollapsed);
        saveState();
    }
}

// URL validation
function isValidUrl(string) {
    if (!string || string.trim() === '') return true; // Empty is ok (optional)
    // Allow http, https, and Windows app URI schemes
    const urlPattern = /^(https?:\/\/|ms-|calculator:|xbox:|msteams:|bingmaps:|msnweather:|feedback-hub:).+/i;
    return urlPattern.test(string.trim());
}

function validateUrlInput(input) {
    const value = input.value.trim();
    if (value && !isValidUrl(value)) {
        input.classList.add('invalid');
        return false;
    } else {
        input.classList.remove('invalid');
        return true;
    }
}

function validateAllUrls() {
    let allValid = true;
    let invalidCount = 0;

    // Validate grouped links
    groups.forEach(group => {
        group.links.forEach(link => {
            if (link.url && !isValidUrl(link.url)) {
                allValid = false;
                invalidCount++;
                const input = document.getElementById(`link-url-${group.id}-${link.id}`);
                if (input) input.classList.add('invalid');
            }
        });
    });

    // Validate ungrouped links
    ungroupedLinks.forEach(link => {
        if (link.url && !isValidUrl(link.url)) {
            allValid = false;
            invalidCount++;
            const input = document.getElementById(`ungrouped-url-${link.id}`);
            if (input) input.classList.add('invalid');
        }
    });

    if (!allValid) {
        alert(`${invalidCount} invalid URL${invalidCount > 1 ? 's' : ''} found. Please fix the highlighted fields.\n\nURLs must start with http://, https://, or be a valid Windows app URI.`);
    }

    return allValid;
}

// localStorage key for saving state
const STORAGE_KEY = 'startPageStudioState';

// Save current state to localStorage
function saveState() {
    const state = {
        groups,
        ungroupedLinks,
        groupIdCounter,
        linkIdCounter,
        selectedTheme,
        customColors,
        settings: {
            pageTitle: document.getElementById('pageTitle').value,
            greeting: document.getElementById('greeting').value,
            showComputerName: document.getElementById('showComputerName').checked,
            computerNamePosition: document.getElementById('computerNamePosition').value,
            showDateTime: document.getElementById('showDateTime').checked,
            dateTimeFormat: document.getElementById('dateTimeFormat').value,
            dateTimePosition: document.getElementById('dateTimePosition').value,
            topLogoUrl: document.getElementById('topLogoUrl').value,
            sideLogoUrl: document.getElementById('sideLogoUrl').value,
            sideLogoPosition: document.getElementById('sideLogoPosition').value,
            showFooter: document.getElementById('showFooter').checked,
            footerText: document.getElementById('footerText').value,
            enableAutoRefresh: document.getElementById('enableAutoRefresh').checked,
            autoRefreshDelay: document.getElementById('autoRefreshDelay').value,
            autoRefreshUrl: document.getElementById('autoRefreshUrl').value,
            scriptName: document.getElementById('scriptName').value,
            destinationPath: document.getElementById('destinationPath').value
        }
    };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        showSaveIndicator();
    } catch (e) {
        console.warn('Could not save state to localStorage:', e);
        showSaveIndicator('Save failed');
    }
}

// Show save indicator briefly
function showSaveIndicator(message = 'Saved') {
    const indicator = document.getElementById('saveIndicator');
    if (!indicator) return;

    clearTimeout(saveIndicatorTimeout);
    indicator.textContent = message;
    indicator.classList.add('visible');

    saveIndicatorTimeout = setTimeout(() => {
        indicator.classList.remove('visible');
    }, 1500);
}

// Load state from localStorage
function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const state = JSON.parse(saved);

            // Restore arrays and counters
            groups = state.groups || [];
            ungroupedLinks = state.ungroupedLinks || [];
            groupIdCounter = state.groupIdCounter || 0;
            linkIdCounter = state.linkIdCounter || 0;
            selectedTheme = state.selectedTheme || 'monochrome';
            customColors = state.customColors || { primary: '#0053E2', accent: '#FFC220' };

            // Restore form settings
            if (state.settings) {
                document.getElementById('pageTitle').value = state.settings.pageTitle || 'Quick Links';
                document.getElementById('greeting').value = state.settings.greeting || 'Welcome';
                document.getElementById('showComputerName').checked = state.settings.showComputerName !== false;
                document.getElementById('computerNamePosition').value = state.settings.computerNamePosition || 'top-right';
                document.getElementById('showDateTime').checked = state.settings.showDateTime || false;
                document.getElementById('dateTimeFormat').value = state.settings.dateTimeFormat || 'both';
                document.getElementById('dateTimePosition').value = state.settings.dateTimePosition || 'top-left';
                document.getElementById('topLogoUrl').value = state.settings.topLogoUrl || state.settings.headerLogoUrl || state.settings.logoUrl || '';
                document.getElementById('sideLogoUrl').value = state.settings.sideLogoUrl || state.settings.cornerLogoUrl || '';
                document.getElementById('sideLogoPosition').value = state.settings.sideLogoPosition || 'left';
                document.getElementById('showFooter').checked = state.settings.showFooter !== false;
                document.getElementById('footerText').value = state.settings.footerText || '';
                document.getElementById('enableAutoRefresh').checked = state.settings.enableAutoRefresh || false;
                document.getElementById('autoRefreshDelay').value = state.settings.autoRefreshDelay || '30';
                document.getElementById('autoRefreshUrl').value = state.settings.autoRefreshUrl || '';
                document.getElementById('scriptName').value = state.settings.scriptName || 'MyLandingPage';
                document.getElementById('destinationPath').value = state.settings.destinationPath || 'C:\\ProgramData\\LandingPage\\index.html';

                // Restore custom color inputs if custom theme
                if (selectedTheme === 'custom') {
                    document.getElementById('customPrimary').value = customColors.primary;
                    document.getElementById('customPrimaryPicker').value = customColors.primary;
                    document.getElementById('customAccent').value = customColors.accent;
                    document.getElementById('customAccentPicker').value = customColors.accent;
                }
            }
            return true;
        }
    } catch (e) {
        console.warn('Could not load state from localStorage:', e);
    }
    return false;
}

// Initialize application
function init() {
    const hasExistingState = loadState();

    renderThemeSwatches();

    if (!hasExistingState) {
        // Set defaults for new users (no logo by default)
        addGroup('Productivity', [
            { name: 'Email', url: 'https://outlook.office.com' }
        ], true);
        addGroup('Resources', [
            { name: 'Help Desk', url: 'https://support.example.com' }
        ], true);
    } else {
        // Render loaded state
        renderGroups();
        renderUngroupedLinks();
    }

    updatePreview();
}

// Add a new group
function addGroup(name = '', links = [], silent = false) {
    const groupId = groupIdCounter++;
    const groupName = name || 'New Group';
    const group = {
        id: groupId,
        name: groupName,
        links: links.length ? links.map(l => ({ ...l, id: linkIdCounter++ })) : []
    };
    groups.push(group);
    renderGroups();
    updatePreview();
    if (!silent) {
        announce(`Group "${groupName}" added`);
    }
}

// Remove a group
function removeGroup(groupId) {
    const group = groups.find(g => g.id === groupId);
    const groupName = group ? group.name : 'Group';
    const linkCount = group ? group.links.length : 0;
    const message = linkCount > 0
        ? `Delete "${groupName}" and its ${linkCount} link${linkCount === 1 ? '' : 's'}?`
        : `Delete "${groupName}"?`;
    if (!confirm(message)) return;
    groups = groups.filter(g => g.id !== groupId);
    renderGroups();
    updatePreview();
    announce(`Group "${groupName}" removed`);
}

// Add a link to a group
function addLinkToGroup(groupId) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.links.push({ id: linkIdCounter++, name: '', url: '' });
        renderGroups();
        updatePreview();
        announce(`New link added to "${group.name}"`);
    }
}

// Remove a link from a group
function removeLinkFromGroup(groupId, linkId) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        const link = group.links.find(l => l.id === linkId);
        const linkName = link && link.name ? link.name : 'Link';
        if (!confirm(`Delete "${linkName}"?`)) return;
        group.links = group.links.filter(l => l.id !== linkId);
        renderGroups();
        updatePreview();
        announce(`"${linkName}" removed from "${group.name}"`);
    }
}

// Drag and drop state
let draggedGroupId = null;
let draggedLinkId = null;
let draggedLinkGroupId = null;

// Group drag handlers
function handleGroupDragStart(e, groupId) {
    draggedGroupId = groupId;
    e.target.closest('.group-card').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleGroupDragEnd(e) {
    draggedGroupId = null;
    document.querySelectorAll('.group-card').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
}

function handleGroupDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const card = e.target.closest('.group-card');
    if (card && draggedGroupId !== null) {
        card.classList.add('drag-over');
    }
}

function handleGroupDragLeave(e) {
    const card = e.target.closest('.group-card');
    if (card) {
        card.classList.remove('drag-over');
    }
}

function handleGroupDrop(e, targetGroupId) {
    e.preventDefault();
    if (draggedGroupId === null || draggedGroupId === targetGroupId) return;

    const fromIndex = groups.findIndex(g => g.id === draggedGroupId);
    const toIndex = groups.findIndex(g => g.id === targetGroupId);

    if (fromIndex !== -1 && toIndex !== -1) {
        const [movedGroup] = groups.splice(fromIndex, 1);
        groups.splice(toIndex, 0, movedGroup);
        renderGroups();
        updatePreview();
        announce('Group reordered');
    }
}

// Link drag handlers
function handleLinkDragStart(e, groupId, linkId) {
    draggedLinkId = linkId;
    draggedLinkGroupId = groupId;
    e.target.closest('.link-row').classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleLinkDragEnd(e) {
    draggedLinkId = null;
    draggedLinkGroupId = null;
    document.querySelectorAll('.link-row').forEach(el => {
        el.classList.remove('dragging', 'drag-over');
    });
}

function handleLinkDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const row = e.target.closest('.link-row');
    if (row && draggedLinkId !== null) {
        row.classList.add('drag-over');
    }
}

function handleLinkDragLeave(e) {
    const row = e.target.closest('.link-row');
    if (row) {
        row.classList.remove('drag-over');
    }
}

function handleLinkDrop(e, targetGroupId, targetLinkId) {
    e.preventDefault();
    if (draggedLinkId === null) return;

    const sourceGroup = groups.find(g => g.id === draggedLinkGroupId);
    const targetGroup = groups.find(g => g.id === targetGroupId);

    if (!sourceGroup || !targetGroup) return;

    const fromIndex = sourceGroup.links.findIndex(l => l.id === draggedLinkId);
    const toIndex = targetGroup.links.findIndex(l => l.id === targetLinkId);

    if (fromIndex === -1) return;

    // Remove from source
    const [movedLink] = sourceGroup.links.splice(fromIndex, 1);

    // Add to target
    if (toIndex === -1) {
        targetGroup.links.push(movedLink);
    } else {
        targetGroup.links.splice(toIndex, 0, movedLink);
    }

    renderGroups();
    updatePreview();
    announce('Link reordered');
}

// Update group name
function updateGroupName(groupId, name) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        group.name = name;
        updatePreview();
    }
}

// Update link in group
function updateGroupLink(groupId, linkId, field, value) {
    const group = groups.find(g => g.id === groupId);
    if (group) {
        const link = group.links.find(l => l.id === linkId);
        if (link) {
            link[field] = value;
            updatePreview();
        }
    }
}

// Add ungrouped link
function addUngroupedLink() {
    ungroupedLinks.push({ id: linkIdCounter++, name: '', url: '' });
    renderUngroupedLinks();
    updatePreview();
    announce('New ungrouped link added');
}

// Remove ungrouped link
function removeUngroupedLink(linkId) {
    const link = ungroupedLinks.find(l => l.id === linkId);
    const linkName = link && link.name ? link.name : 'Link';
    if (!confirm(`Delete "${linkName}"?`)) return;
    ungroupedLinks = ungroupedLinks.filter(l => l.id !== linkId);
    renderUngroupedLinks();
    updatePreview();
    announce(`"${linkName}" removed`);
}

// Update ungrouped link
function updateUngroupedLink(linkId, field, value) {
    const link = ungroupedLinks.find(l => l.id === linkId);
    if (link) {
        link[field] = value;
        updatePreview();
    }
}

// Render groups to DOM
function renderGroups() {
    const container = document.getElementById('groupsContainer');

    if (groups.length === 0) {
        container.innerHTML = '<p class="empty-message">No groups added yet. Click "Add Group" to create one.</p>';
        return;
    }

    container.innerHTML = groups.map((group, groupIndex) => `
        <fieldset class="group-card" data-group-id="${group.id}" aria-label="Link group ${groupIndex + 1}"
                  draggable="true"
                  ondragstart="handleGroupDragStart(event, ${group.id})"
                  ondragend="handleGroupDragEnd(event)"
                  ondragover="handleGroupDragOver(event)"
                  ondragleave="handleGroupDragLeave(event)"
                  ondrop="handleGroupDrop(event, ${group.id})">
            <div class="group-header">
                <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
                <label for="group-name-${group.id}" class="visually-hidden">Group ${groupIndex + 1} name</label>
                <input type="text" id="group-name-${group.id}" value="${escapeHtml(group.name)}"
                       placeholder="Group name"
                       aria-label="Group name"
                       onchange="updateGroupName(${group.id}, this.value)">
                <button type="button" class="btn btn-danger btn-sm" onclick="removeGroup(${group.id})" aria-label="Remove group ${escapeHtml(group.name) || groupIndex + 1}">Remove</button>
            </div>
            <div class="group-icon-row">
                <label for="group-icon-${group.id}" class="group-icon-label">Icon:</label>
                <input type="text" id="group-icon-${group.id}" value="${escapeHtml(group.icon || '')}"
                       placeholder="Icon URL (optional)"
                       aria-label="Group icon URL"
                       oninput="updateGroupIcon(${group.id}, this.value)">
                <label for="group-icon-upload-${group.id}" class="btn btn-secondary btn-sm upload-btn" title="Upload SVG">
                    SVG
                    <input type="file" id="group-icon-upload-${group.id}" accept=".svg,image/svg+xml" onchange="handleGroupIconUpload(${group.id}, this)" class="visually-hidden">
                </label>
                ${group.icon ? `<img src="${escapeHtml(group.icon)}" alt="" style="width:20px;height:20px;">` : ''}
                <button type="button" class="btn btn-sm" onclick="clearGroupIcon(${group.id})" aria-label="Clear icon" title="Clear">✕</button>
            </div>
            <div class="group-links" role="list" aria-label="Links in ${escapeHtml(group.name) || 'this group'}">
                ${group.links.length === 0 ? '<p class="empty-message" role="listitem">No links in this group</p>' : ''}
                ${group.links.map((link, linkIndex) => `
                    <div class="link-row" role="listitem"
                         draggable="true"
                         ondragstart="handleLinkDragStart(event, ${group.id}, ${link.id})"
                         ondragend="handleLinkDragEnd(event)"
                         ondragover="handleLinkDragOver(event)"
                         ondragleave="handleLinkDragLeave(event)"
                         ondrop="handleLinkDrop(event, ${group.id}, ${link.id})">
                        <span class="drag-handle" title="Drag to reorder">⋮</span>
                        <select class="link-type-select" aria-label="Link type" onchange="updateGroupLink(${group.id}, ${link.id}, 'type', this.value); renderGroups();">
                            <option value="web" ${(link.type || 'web') === 'web' ? 'selected' : ''}>Web</option>
                            <option value="app" ${link.type === 'app' ? 'selected' : ''}>App</option>
                        </select>
                        <input type="text" id="link-name-${group.id}-${link.id}" value="${escapeHtml(link.name)}"
                               placeholder="Display name"
                               aria-label="Link display name"
                               class="${!link.name ? 'empty-warning' : ''}"
                               title="${!link.name ? 'Empty names will not appear in the generated page' : ''}"
                               onchange="updateGroupLink(${group.id}, ${link.id}, 'name', this.value)">
                        ${(link.type || 'web') === 'web' ? `
                        <input type="url" id="link-url-${group.id}-${link.id}" value="${escapeHtml(link.url || '')}"
                               placeholder="https://example.com"
                               aria-label="Link URL"
                               onchange="updateGroupLink(${group.id}, ${link.id}, 'url', this.value)"
                               onblur="validateUrlInput(this)">
                        ` : `
                        <input type="text" id="link-apppath-${group.id}-${link.id}" value="${escapeHtml(link.appPath || '')}"
                               placeholder="C:\\Windows\\System32\\app.exe"
                               aria-label="Executable path"
                               onchange="updateGroupLink(${group.id}, ${link.id}, 'appPath', this.value)">
                        <input type="text" id="link-shortcut-${group.id}-${link.id}" value="${escapeHtml(link.shortcutName || '')}"
                               placeholder="Shortcut.lnk"
                               aria-label="Shortcut filename"
                               style="width: 120px;"
                               onchange="updateGroupLink(${group.id}, ${link.id}, 'shortcutName', this.value)">
                        `}
                        <button type="button" class="btn btn-danger btn-sm" onclick="removeLinkFromGroup(${group.id}, ${link.id})" aria-label="Remove link ${escapeHtml(link.name) || linkIndex + 1}">
                            <span aria-hidden="true">X</span>
                            <span class="visually-hidden">Remove</span>
                        </button>
                    </div>
                `).join('')}
                <button type="button" class="btn btn-secondary btn-sm" onclick="addLinkToGroup(${group.id})" aria-label="Add link to ${escapeHtml(group.name) || 'this group'}">+ Add Link</button>
            </div>
        </fieldset>
    `).join('');
}

// Render ungrouped links
function renderUngroupedLinks() {
    const container = document.getElementById('ungroupedLinksContainer');

    if (ungroupedLinks.length === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `<div role="list" aria-label="Standalone links">` + ungroupedLinks.map((link, linkIndex) => `
        <div class="link-row" style="margin-bottom: 0.75rem;" role="listitem">
            <select class="link-type-select" aria-label="Link type" onchange="updateUngroupedLink(${link.id}, 'type', this.value); renderUngroupedLinks();">
                <option value="web" ${(link.type || 'web') === 'web' ? 'selected' : ''}>Web</option>
                <option value="app" ${link.type === 'app' ? 'selected' : ''}>App</option>
            </select>
            <input type="text" id="ungrouped-name-${link.id}" value="${escapeHtml(link.name)}"
                   placeholder="Display name"
                   aria-label="Link display name"
                   class="${!link.name ? 'empty-warning' : ''}"
                   title="${!link.name ? 'Empty names will not appear in the generated page' : ''}"
                   onchange="updateUngroupedLink(${link.id}, 'name', this.value)">
            ${(link.type || 'web') === 'web' ? `
            <input type="url" id="ungrouped-url-${link.id}" value="${escapeHtml(link.url || '')}"
                   placeholder="https://example.com"
                   aria-label="Link URL"
                   onchange="updateUngroupedLink(${link.id}, 'url', this.value)"
                   onblur="validateUrlInput(this)">
            ` : `
            <input type="text" id="ungrouped-apppath-${link.id}" value="${escapeHtml(link.appPath || '')}"
                   placeholder="C:\\Windows\\System32\\app.exe"
                   aria-label="Executable path"
                   onchange="updateUngroupedLink(${link.id}, 'appPath', this.value)">
            <input type="text" id="ungrouped-shortcut-${link.id}" value="${escapeHtml(link.shortcutName || '')}"
                   placeholder="Shortcut.lnk"
                   aria-label="Shortcut filename"
                   style="width: 120px;"
                   onchange="updateUngroupedLink(${link.id}, 'shortcutName', this.value)">
            `}
            <button type="button" class="btn btn-danger btn-sm" onclick="removeUngroupedLink(${link.id})" aria-label="Remove link ${escapeHtml(link.name) || linkIndex + 1}">
                <span aria-hidden="true">X</span>
                <span class="visually-hidden">Remove</span>
            </button>
        </div>
    `).join('') + `</div>`;
}

// Escape HTML for safe insertion
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

// Generate the HTML content
function generateHTML(useComputerNameVariable = false) {
    const pageTitle = document.getElementById('pageTitle').value || 'Landing Page';
    const greeting = document.getElementById('greeting').value || 'Welcome';
    const showComputerName = document.getElementById('showComputerName').checked;
    const computerNamePosition = document.getElementById('computerNamePosition').value;
    const showDateTime = document.getElementById('showDateTime').checked;
    const dateTimeFormat = document.getElementById('dateTimeFormat').value;
    const dateTimePosition = document.getElementById('dateTimePosition').value;
    const topLogoUrl = document.getElementById('topLogoUrl').value.trim();
    const sideLogoUrl = document.getElementById('sideLogoUrl').value.trim();
    const sideLogoPosition = document.getElementById('sideLogoPosition').value;
    const showFooter = document.getElementById('showFooter').checked;
    const enableAutoRefresh = document.getElementById('enableAutoRefresh').checked;
    const autoRefreshDelay = document.getElementById('autoRefreshDelay').value || '30';
    const autoRefreshUrl = document.getElementById('autoRefreshUrl').value.trim();
    const footerText = document.getElementById('footerText').value || '';
    const colors = getActiveColors();

    const computerNameDisplay = useComputerNameVariable ? '$computerName' : 'COMPUTER-NAME';

    // Build links HTML
    let linksHTML = '';

    // Add grouped links
    const validGroups = groups.filter(g => g.name && g.links.some(l => l.name && (l.url || l.appPath)));
    if (validGroups.length > 0) {
        linksHTML += validGroups.map(group => {
            const validLinks = group.links.filter(l => l.name && (l.url || l.appPath));
            if (validLinks.length === 0) return '';

            const groupId = group.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const groupIconHtml = group.icon ? `<img class="group-icon" src="${escapeHtml(group.icon)}" alt="">` : '';
            return `
            <section class="link-group" aria-labelledby="${groupId}-heading">
                <div class="group-heading-row">
                    ${groupIconHtml}<h2 id="${groupId}-heading" class="group-heading">${escapeHtml(group.name)}</h2>
                </div>
                <ul class="links-list">
                    ${validLinks.map(link => {
                        const href = link.type === 'app'
                            ? './' + escapeHtml(link.shortcutName || link.name + '.lnk')
                            : escapeHtml(link.url);
                        return `<li><a href="${href}" class="link-button">${escapeHtml(link.name)}</a></li>`;
                    }).join('')}
                </ul>
            </section>`;
        }).join('');
    }

    // Add standalone links (no group heading)
    const validUngrouped = ungroupedLinks.filter(l => l.name && (l.url || l.appPath));
    if (validUngrouped.length > 0) {
        linksHTML += `
            <div class="standalone-links">
                ${validUngrouped.map(link => {
                    const href = link.type === 'app'
                        ? './' + escapeHtml(link.shortcutName || link.name + '.lnk')
                        : escapeHtml(link.url);
                    return `<a href="${href}" class="link-button standalone">${escapeHtml(link.name)}</a>`;
                }).join('')}
            </div>`;
    }

    // If no links at all, show placeholder
    if (!linksHTML) {
        linksHTML = `
            <p style="color: rgba(255,255,255,0.7); font-style: italic;">No links configured</p>`;
    }

    const topLogoHTML = topLogoUrl ? `<img class="top-logo" src="${escapeHtml(topLogoUrl)}" alt="Logo">` : '';
    const sideLogoHTML = sideLogoUrl ? `<img class="side-logo" src="${escapeHtml(sideLogoUrl)}" alt="">` : '';
    const cornerPositions = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    const isSideLogoCorner = sideLogoUrl && cornerPositions.includes(sideLogoPosition);

    // Build welcome header with proper structure
    let welcomeHeader = '';
    if (topLogoUrl) {
        welcomeHeader += `
        <div class="top-logo-container">
            ${topLogoHTML}
        </div>`;
    }

    if (sideLogoUrl && !isSideLogoCorner) {
        // Side logo next to greeting
        const logoFirst = sideLogoPosition === 'left';
        welcomeHeader += `
        <div class="greeting-row${sideLogoPosition === 'right' ? ' logo-right' : ''}">
            ${logoFirst ? sideLogoHTML : ''}<h1>${escapeHtml(greeting)}</h1>${!logoFirst ? sideLogoHTML : ''}
        </div>`;
    } else {
        welcomeHeader += `
        <h1>${escapeHtml(greeting)}</h1>`;
    }

    // Corner logo overlay HTML (rendered separately in body)
    const cornerLogoHTML = isSideLogoCorner ? `
    <div class="corner-logo ${sideLogoPosition}">
        <img src="${escapeHtml(sideLogoUrl)}" alt="Logo">
    </div>` : '';

    // Build configuration object for import/export
    const config = {
        version: '1.0',
        generator: 'Landing Page Studio',
        settings: {
            pageTitle,
            greeting,
            showComputerName,
            computerNamePosition,
            showDateTime,
            dateTimeFormat,
            dateTimePosition,
            topLogoUrl,
            sideLogoUrl,
            sideLogoPosition,
            showFooter,
            footerText,
            enableAutoRefresh,
            autoRefreshDelay,
            autoRefreshUrl
        },
        theme: {
            selectedTheme,
            customColors: selectedTheme === 'custom' ? customColors : null,
            primary: colors.primary,
            accent: colors.accent
        },
        groups: groups.map(g => ({
            name: g.name,
            icon: g.icon || '',
            links: g.links.map(l => ({
                name: l.name,
                type: l.type || 'web',
                url: l.url || '',
                appPath: l.appPath || '',
                shortcutName: l.shortcutName || ''
            }))
        })),
        ungroupedLinks: ungroupedLinks.map(l => ({
            name: l.name,
            type: l.type || 'web',
            url: l.url || '',
            appPath: l.appPath || '',
            shortcutName: l.shortcutName || ''
        }))
    };
    const configJson = JSON.stringify(config);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="generator" content="Landing Page Studio">
    <meta name="description" content="Quick links landing page">${enableAutoRefresh && autoRefreshUrl ? `
    <meta http-equiv="refresh" content="${autoRefreshDelay};url=${escapeHtml(autoRefreshUrl)}">` : ''}
    <title>${escapeHtml(pageTitle)}</title>
    <style>
        :root {
            --primary-color: ${colors.primary};
            --accent-color: ${colors.accent};
            --white: #FFFFFF;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: var(--primary-color);
            color: var(--white);
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }

        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent-color);
            color: var(--primary-color);
            padding: 8px 16px;
            z-index: 100;
            font-weight: bold;
            text-decoration: none;
        }

        .skip-link:focus {
            top: 0;
        }

        .computer-name {
            position: fixed;
            background-color: var(--white);
            color: var(--primary-color);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 600;
            z-index: 50;
        }

        .computer-name.top-right {
            top: 1rem;
            right: 1rem;
        }

        .computer-name.top-center {
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .computer-name.top-left {
            top: 1rem;
            left: 1rem;
        }

        .computer-name.bottom-right {
            bottom: 1rem;
            right: 1rem;
        }

        .computer-name.bottom-center {
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .computer-name.bottom-left {
            bottom: 1rem;
            left: 1rem;
        }

        .date-time {
            position: fixed;
            background-color: var(--white);
            color: var(--primary-color);
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 600;
            font-family: 'Consolas', 'Monaco', monospace;
            z-index: 50;
        }

        .date-time.top-right {
            top: 1rem;
            right: 1rem;
        }

        .date-time.top-center {
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .date-time.top-left {
            top: 1rem;
            left: 1rem;
        }

        .date-time.bottom-right {
            bottom: 1rem;
            right: 1rem;
        }

        .date-time.bottom-center {
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .date-time.bottom-left {
            bottom: 1rem;
            left: 1rem;
        }

        .corner-logo {
            position: fixed;
            z-index: 50;
            max-width: 120px;
            max-height: 60px;
        }

        .corner-logo img {
            max-width: 100%;
            max-height: 60px;
            object-fit: contain;
        }

        .corner-logo.top-right {
            top: 1rem;
            right: 1rem;
        }

        .corner-logo.top-center {
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .corner-logo.top-left {
            top: 1rem;
            left: 1rem;
        }

        .corner-logo.bottom-right {
            bottom: 1rem;
            right: 1rem;
        }

        .corner-logo.bottom-center {
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
        }

        .corner-logo.bottom-left {
            bottom: 1rem;
            left: 1rem;
        }

        .footer-datetime {
            font-family: 'Consolas', 'Monaco', monospace;
            margin-top: 0.5rem;
        }

        main {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 2rem;
        }

        .top-logo-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1.5rem;
        }

        .top-logo {
            width: 360px;
            height: auto;
        }

        .greeting-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1.25rem;
            margin-bottom: 2rem;
        }

        .greeting-row.logo-right {
            flex-direction: row;
        }

        .side-logo {
            width: 64px;
            height: auto;
            flex-shrink: 0;
        }

        h1 {
            font-size: 3rem;
            color: var(--white);
            margin: 0;
        }

        .links-container {
            width: 100%;
            max-width: 1400px;
            padding: 0 1rem;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1.5rem;
        }

        .link-group {
            flex: 0 1 280px;
            max-width: 350px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 1.25rem;
        }

        .group-heading-row {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .group-icon {
            width: 24px;
            height: 24px;
            flex-shrink: 0;
        }

        .group-heading {
            font-size: 0.875rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--accent-color);
            margin: 0;
        }

        .links-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding: 0;
            margin: 0;
        }

        .standalone-links {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: center;
            margin-top: 1.5rem;
        }

        .standalone-links .link-button {
            min-width: 150px;
        }

        .links-list li {
            display: flex;
        }

        .link-button {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
            background-color: var(--accent-color);
            color: var(--primary-color);
            text-decoration: none;
            padding: 1rem 1.5rem;
            font-size: 1rem;
            font-weight: 600;
            border-radius: 8px;
            border: 3px solid var(--accent-color);
            transition: background-color 0.2s ease, color 0.2s ease, transform 0.1s ease;
            min-height: 44px;
            min-width: 44px;
        }

        .link-button:hover,
        .link-button:focus {
            background-color: var(--white);
            color: var(--primary-color);
            outline: none;
            box-shadow: 0 0 0 4px var(--accent-color);
            transform: scale(1.02);
        }

        .link-button:active {
            transform: scale(0.98);
        }

        footer {
            padding: 1rem;
            text-align: center;
            font-size: 0.75rem;
            color: var(--white);
            opacity: 0.7;
        }

        .link-button:focus-visible {
            outline: 3px solid var(--white);
            outline-offset: 2px;
        }

        .skip-link:focus-visible {
            outline: 3px solid var(--primary-color);
            outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
            .link-button {
                transition: none;
            }
        }

        @media (prefers-contrast: high) {
            .link-button {
                border: 3px solid var(--white);
            }
        }

        @media (max-width: 600px) {
            .link-group {
                flex: 1 1 100%;
                max-width: none;
            }
            h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <a href="#main-content" class="skip-link">Skip to main content</a>
${showComputerName ? `
    <div class="computer-name ${computerNamePosition}" role="status" aria-label="Computer name: ${computerNameDisplay}">
        ${computerNameDisplay}
    </div>
` : ''}
${showDateTime && dateTimePosition !== 'footer' ? `
    <div class="date-time ${dateTimePosition}" role="timer" aria-label="Current date and time" id="datetime-display">
        --
    </div>
` : ''}
${cornerLogoHTML}
    <main id="main-content" role="main">
        ${welcomeHeader}

        <nav class="links-container" aria-label="Quick links">
${linksHTML}
        </nav>
    </main>
${(showFooter && footerText) || (showDateTime && dateTimePosition === 'footer') ? `
    <footer role="contentinfo">
        ${showFooter && footerText ? `<p>${escapeHtml(footerText)}</p>` : ''}
        ${showDateTime && dateTimePosition === 'footer' ? `<p class="footer-datetime" id="datetime-display">--</p>` : ''}
    </footer>
` : ''}
${showDateTime ? `
    <script>
        function updateDateTime() {
            const now = new Date();
            const format = '${dateTimeFormat}';
            let display = '';

            if (format === 'date' || format === 'both') {
                display += now.toISOString().split('T')[0];
            }
            if (format === 'both') {
                display += ' ';
            }
            if (format === 'time' || format === 'both') {
                display += now.toTimeString().split(' ')[0];
            }

            document.getElementById('datetime-display').textContent = display;
        }
        updateDateTime();
        setInterval(updateDateTime, 1000);
    <` + `/script>
` : ''}
<!-- Landing Page Studio Config: ${configJson} -->
</body>
</html>`;
}

// Update date/time position options to exclude computer name position
function updateDateTimePositionOptions() {
    const showComputerName = document.getElementById('showComputerName').checked;
    const computerNamePosition = document.getElementById('computerNamePosition').value;
    const dateTimeSelect = document.getElementById('dateTimePosition');
    const currentValue = dateTimeSelect.value;

    const allPositions = [
        { value: 'top-right', label: 'Top Right' },
        { value: 'top-center', label: 'Top Center' },
        { value: 'top-left', label: 'Top Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'bottom-center', label: 'Bottom Center' },
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'footer', label: 'In Footer' }
    ];

    // Filter out the computer name position if computer name is shown
    const availablePositions = showComputerName
        ? allPositions.filter(p => p.value !== computerNamePosition)
        : allPositions;

    // Rebuild options
    dateTimeSelect.innerHTML = availablePositions.map(p =>
        `<option value="${p.value}">${p.label}</option>`
    ).join('');

    // Try to restore previous selection, or pick first available
    if (availablePositions.some(p => p.value === currentValue)) {
        dateTimeSelect.value = currentValue;
    } else {
        dateTimeSelect.value = availablePositions[0].value;
    }
}

// Update the preview iframe
function updatePreview() {
    const iframe = document.getElementById('previewFrame');
    const html = generateHTML(false);
    iframe.srcdoc = html;

    // Toggle footer text visibility
    const showFooter = document.getElementById('showFooter').checked;
    document.getElementById('footerTextGroup').style.display = showFooter ? 'block' : 'none';

    // Toggle computer name position visibility
    const showComputerName = document.getElementById('showComputerName').checked;
    document.getElementById('computerNamePositionGroup').style.display = showComputerName ? 'block' : 'none';

    // Toggle date/time options visibility
    const showDateTime = document.getElementById('showDateTime').checked;
    document.getElementById('dateTimeOptionsGroup').style.display = showDateTime ? 'block' : 'none';
    document.getElementById('dateTimePositionGroup').style.display = showDateTime ? 'block' : 'none';

    // Update date/time position options when computer name settings change
    if (showDateTime) {
        updateDateTimePositionOptions();
    }

    // Toggle side logo position visibility
    const sideLogoUrl = document.getElementById('sideLogoUrl').value.trim();
    document.getElementById('sideLogoPositionGroup').style.display = sideLogoUrl ? 'block' : 'none';

    // Toggle auto-refresh options visibility
    const enableAutoRefresh = document.getElementById('enableAutoRefresh').checked;
    document.getElementById('autoRefreshOptionsGroup').style.display = enableAutoRefresh ? 'block' : 'none';

    // Save state to localStorage
    saveState();
}

// Generate PowerShell script
function generatePowerShellScript() {
    const htmlContent = generateHTML(true);
    // Escape for PowerShell here-string (just need to escape @" and "@ if they appear)
    const escapedHtml = htmlContent.replace(/"@/g, '`"@').replace(/@"/g, '@`"');

    // Get script name and destination path
    const scriptName = document.getElementById('scriptName').value || 'MyLandingPage';
    const sanitizedScriptName = scriptName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const destinationPath = document.getElementById('destinationPath').value || 'C:\\ProgramData\\LandingPage\\index.html';
    const escapedDestPath = destinationPath.replace(/\\/g, '\\\\');
    const folderPath = destinationPath.substring(0, destinationPath.lastIndexOf('\\')) || 'C:\\ProgramData\\LandingPage';
    const escapedFolderPath = folderPath.replace(/\\/g, '\\\\');

    // Collect all app links for shortcut creation
    const appLinks = [];
    groups.forEach(group => {
        group.links.forEach(link => {
            if (link.type === 'app' && link.appPath) {
                appLinks.push({
                    name: link.shortcutName || (link.name + '.lnk'),
                    path: link.appPath
                });
            }
        });
    });
    ungroupedLinks.forEach(link => {
        if (link.type === 'app' && link.appPath) {
            appLinks.push({
                name: link.shortcutName || (link.name + '.lnk'),
                path: link.appPath
            });
        }
    });

    // Generate shortcut creation code
    let shortcutCode = '';
    if (appLinks.length > 0) {
        shortcutCode = `
# Create shortcuts for local applications
$WshShell = New-Object -ComObject WScript.Shell
`;
        appLinks.forEach(app => {
            const shortcutName = app.name.endsWith('.lnk') ? app.name : app.name + '.lnk';
            const escapedName = shortcutName.replace(/'/g, "''");
            const escapedPath = app.path.replace(/'/g, "''");
            shortcutCode += `
$shortcut = $WshShell.CreateShortcut("$outputFolder\\${escapedName}")
$shortcut.TargetPath = '${escapedPath}'
$shortcut.Save()
Write-Log "Created shortcut: ${escapedName}"
`;
        });
    }

    return `# Generate-LandingPage_${sanitizedScriptName}.ps1
# Generated by Landing Page Studio
# Author: Joshua Walderbach

$computerName = $env:COMPUTERNAME
$outputFolder = "${escapedFolderPath}"
$outputPath = "${escapedDestPath}"
$logFolder = "${escapedFolderPath}\\Logs"
$timestamp = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$logFile = Join-Path $logFolder "Generate-LandingPage_${sanitizedScriptName}_$timestamp.log"

# Create directories if they don't exist
if (-not (Test-Path $outputFolder)) {
    New-Item -ItemType Directory -Path $outputFolder -Force | Out-Null
}
if (-not (Test-Path $logFolder)) {
    New-Item -ItemType Directory -Path $logFolder -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $logLine = "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ss') $Message"
    Write-Host $logLine
    Add-Content -Path $logFile -Value $logLine -ErrorAction SilentlyContinue
}

Write-Log "Script started"
Write-Log "Computer name: $computerName"
Write-Log "Output path: $outputPath"

$htmlContent = @"
${escapedHtml}
"@

# Write the HTML file
$htmlContent | Out-File -FilePath $outputPath -Encoding UTF8 -Force
Write-Log "Landing page generated successfully"
${shortcutCode}
Write-Log "Script completed"
Write-Log "Log file: $logFile"
`;
}

// Show instruction modal
function showInstructionModal() {
    // Save the element that triggered the modal for focus restoration
    modalTriggerElement = document.activeElement;

    const showComputerName = document.getElementById('showComputerName').checked;
    const scriptName = document.getElementById('scriptName').value || 'MyLandingPage';
    const sanitizedScriptName = scriptName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const scriptFilename = `Generate-LandingPage_${sanitizedScriptName}.ps1`;
    const destinationPath = document.getElementById('destinationPath').value || 'C:\\ProgramData\\LandingPage\\index.html';

    let computerNameNote = '';
    if (showComputerName) {
        computerNameNote = '<p><strong>Note:</strong> The computer name will be automatically detected when the script runs on the target machine.</p>';
    }

    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <h3>Next Steps</h3>
        <ol>
            <li>Copy <code>${escapeHtml(scriptFilename)}</code> to your target computer</li>
            <li>Open <strong>Command Prompt</strong> or <strong>PowerShell</strong> as Administrator</li>
            <li>Run the script:
                <div class="code-block">powershell -ExecutionPolicy Bypass -File "${escapeHtml(scriptFilename)}"</div>
            </li>
            <li>Open the landing page in your browser:
                <div class="code-block">${escapeHtml(destinationPath)}</div>
            </li>
        </ol>
        ${computerNameNote}
        <h3>Setting as Browser Homepage</h3>
        <p>To use this as your browser's start page, set the homepage URL to:</p>
        <div class="code-block">file:///${escapeHtml(destinationPath.replace(/\\/g, '/'))}</div>
    `;

    document.getElementById('instructionModal').classList.add('visible');
    document.querySelector('.modal-close').focus();
}

// Close modal
function closeModal() {
    document.getElementById('instructionModal').classList.remove('visible');
    // Restore focus to the element that triggered the modal
    if (modalTriggerElement && typeof modalTriggerElement.focus === 'function') {
        modalTriggerElement.focus();
        modalTriggerElement = null;
    }
}

// Close modal on Escape key or click outside
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

document.getElementById('instructionModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Download PowerShell script
function downloadScript() {
    if (!validateAllUrls()) return;
    const scriptName = document.getElementById('scriptName').value || 'MyLandingPage';
    const sanitizedScriptName = scriptName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const script = generatePowerShellScript();
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Generate-LandingPage_${sanitizedScriptName}.ps1`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce('PowerShell script downloaded');

    // Show instruction modal
    showInstructionModal();
}

// Download HTML only
function downloadHTML() {
    if (!validateAllUrls()) return;
    const html = generateHTML(false);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    announce('HTML file downloaded');
}

// Import existing landing page
function importStartPage(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const html = e.target.result;

        // Check for Landing Page Studio or StartPage Studio signature (backwards compatible)
        if (!html.includes('<meta name="generator" content="Landing Page Studio">') &&
            !html.includes('<meta name="generator" content="StartPage Studio">')) {
            alert('This file was not created by Landing Page Studio.\n\nOnly HTML files generated by this tool can be imported.');
            input.value = '';
            return;
        }

        // Extract config from comment (check both new and old format)
        let configMatch = html.match(/<!-- Landing Page Studio Config: (.+?) -->/);
        if (!configMatch) {
            configMatch = html.match(/<!-- StartPage Studio Config: (.+?) -->/);
        }
        if (!configMatch) {
            alert('Could not find configuration data in this file.\n\nThe file may have been modified or is from an older version.');
            input.value = '';
            return;
        }

        try {
            const config = JSON.parse(configMatch[1]);
            applyImportedConfig(config);
            announce('Landing page imported successfully');
            alert('Landing page imported successfully!\n\nYou can now edit and re-export it.');
        } catch (err) {
            alert('Error parsing configuration data.\n\nThe file may be corrupted.');
            console.error('Import error:', err);
        }

        input.value = ''; // Reset file input
    };
    reader.readAsText(file);
}

// Apply imported configuration
function applyImportedConfig(config) {
    // Apply settings
    if (config.settings) {
        document.getElementById('pageTitle').value = config.settings.pageTitle || 'Quick Links';
        document.getElementById('greeting').value = config.settings.greeting || 'Welcome';
        document.getElementById('showComputerName').checked = config.settings.showComputerName !== false;
        document.getElementById('computerNamePosition').value = config.settings.computerNamePosition || 'top-right';
        document.getElementById('showDateTime').checked = config.settings.showDateTime || false;
        document.getElementById('dateTimeFormat').value = config.settings.dateTimeFormat || 'both';
        document.getElementById('dateTimePosition').value = config.settings.dateTimePosition || 'top-left';
        document.getElementById('topLogoUrl').value = config.settings.topLogoUrl || '';
        document.getElementById('sideLogoUrl').value = config.settings.sideLogoUrl || '';
        document.getElementById('sideLogoPosition').value = config.settings.sideLogoPosition || 'left';
        document.getElementById('showFooter').checked = config.settings.showFooter !== false;
        document.getElementById('footerText').value = config.settings.footerText || '';
        document.getElementById('enableAutoRefresh').checked = config.settings.enableAutoRefresh || false;
        document.getElementById('autoRefreshDelay').value = config.settings.autoRefreshDelay || '30';
        document.getElementById('autoRefreshUrl').value = config.settings.autoRefreshUrl || '';
    }

    // Apply theme
    if (config.theme) {
        selectedTheme = config.theme.selectedTheme || 'monochrome';
        if (config.theme.customColors) {
            customColors = config.theme.customColors;
            document.getElementById('customPrimary').value = customColors.primary;
            document.getElementById('customPrimaryPicker').value = customColors.primary;
            document.getElementById('customAccent').value = customColors.accent;
            document.getElementById('customAccentPicker').value = customColors.accent;
        }
        renderThemeSwatches();
    }

    // Apply groups
    if (config.groups) {
        groups = config.groups.map(g => ({
            id: groupIdCounter++,
            name: g.name,
            icon: g.icon || '',
            links: g.links.map(l => ({
                id: linkIdCounter++,
                name: l.name,
                type: l.type || 'web',
                url: l.url || '',
                appPath: l.appPath || '',
                shortcutName: l.shortcutName || ''
            }))
        }));
        renderGroups();
    }

    // Apply ungrouped links
    if (config.ungroupedLinks) {
        ungroupedLinks = config.ungroupedLinks.map(l => ({
            id: linkIdCounter++,
            name: l.name,
            type: l.type || 'web',
            url: l.url || '',
            appPath: l.appPath || '',
            shortcutName: l.shortcutName || ''
        }));
        renderUngroupedLinks();
    }

    updatePreview();
    saveState();
}

// Reset everything to defaults
function resetAll() {
    if (!confirm('Are you sure you want to reset everything?\n\nThis will clear all your settings, groups, and links. This cannot be undone.')) {
        return;
    }

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);

    // Reset state variables
    groups = [];
    ungroupedLinks = [];
    groupIdCounter = 0;
    linkIdCounter = 0;
    selectedTheme = DEFAULTS.theme;
    customColors = { ...DEFAULTS.customColors };

    // Reset form fields to defaults
    document.getElementById('pageTitle').value = DEFAULTS.pageTitle;
    document.getElementById('greeting').value = DEFAULTS.greeting;
    document.getElementById('showComputerName').checked = true;
    document.getElementById('computerNamePosition').value = DEFAULTS.computerNamePosition;
    document.getElementById('showDateTime').checked = false;
    document.getElementById('dateTimeFormat').value = DEFAULTS.dateTimeFormat;
    document.getElementById('dateTimePosition').value = DEFAULTS.dateTimePosition;
    document.getElementById('topLogoUrl').value = '';
    document.getElementById('sideLogoUrl').value = '';
    document.getElementById('sideLogoPosition').value = DEFAULTS.sideLogoPosition;
    document.getElementById('showFooter').checked = true;
    document.getElementById('footerText').value = '';
    document.getElementById('enableAutoRefresh').checked = false;
    document.getElementById('autoRefreshDelay').value = DEFAULTS.autoRefreshDelay;
    document.getElementById('autoRefreshUrl').value = '';
    document.getElementById('scriptName').value = DEFAULTS.scriptName;
    document.getElementById('destinationPath').value = DEFAULTS.destinationPath;

    // Reset custom color inputs
    document.getElementById('customPrimary').value = DEFAULTS.customColors.primary;
    document.getElementById('customPrimaryPicker').value = DEFAULTS.customColors.primary;
    document.getElementById('customAccent').value = DEFAULTS.customColors.accent;
    document.getElementById('customAccentPicker').value = DEFAULTS.customColors.accent;

    // Re-render
    renderThemeSwatches();
    renderGroups();
    renderUngroupedLinks();
    updatePreview();

    announce('All settings have been reset');
    alert('Everything has been reset to defaults.');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

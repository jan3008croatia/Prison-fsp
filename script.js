// ===== GAME DATA STRUCTURE =====
let gameState = {
    playerName: '',
    prisoners: [],
    events: [],
    statistics: {
        totalPrisoners: 0,
        normalCells: 0,
        mediumCells: 0,
        securedCells: 0,
        escaped: 0,
        released: 0
    }
};

let currentPrisonerData = {};
let currentPrisonerId = null;
let pendingAction = null;

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
    gameState = {
        playerName: '',
        prisoners: [],
        events: [],
        statistics: {
            totalPrisoners: 0,
            normalCells: 0,
            mediumCells: 0,
            securedCells: 0,
            escaped: 0,
            released: 0
        }
    };

    showScreen('welcomeScreen');
    setupNameInputValidation();

    // Random events every 30 seconds
    setInterval(triggerRandomEvent, 30000);
    
    // Escape checks every 20 seconds
    setInterval(checkPrisonerEscapes, 20000);
});

// ===== SCREEN MANAGEMENT =====
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function setupNameInputValidation() {
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const accountCodeInput = document.getElementById('accountCode');
    const startGameBtn = document.getElementById('startGameBtn');

    const validateNameInputs = () => {
        const hasFirstName = firstNameInput.value.trim().length > 0;
        const hasLastName = lastNameInput.value.trim().length > 0;
        const hasAccountCode = accountCodeInput.value.trim().length > 0;
        startGameBtn.disabled = !(hasFirstName && hasLastName && hasAccountCode);
    };

    firstNameInput.addEventListener('input', validateNameInputs);
    lastNameInput.addEventListener('input', validateNameInputs);
    accountCodeInput.addEventListener('input', validateNameInputs);
    
    // Initial check
    validateNameInputs();
}

// ===== WELCOME SCREEN =====
function startGame() {
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const accountCode = document.getElementById('accountCode').value.trim();

    if (!firstName || !lastName || !accountCode) {
        showNotification('You must enter your first name, last name, and account code to proceed', 'error');
        return;
    }

    const playerName = `${firstName} ${lastName}`;
    const saved = loadPlayerProgress(playerName, accountCode);
    const isReturningPlayer = !!saved;
    gameState = saved || {
        playerName,
        accountCode,
        prisoners: [],
        events: [],
        statistics: {
            totalPrisoners: 0,
            normalCells: 0,
            mediumCells: 0,
            securedCells: 0,
            escaped: 0,
            released: 0
        }
    };

    gameState.playerName = playerName;
    gameState.accountCode = accountCode;
    saveGameData();
    
    document.getElementById('playerName').textContent = gameState.playerName;
    showScreen('dashboardScreen');
    updateDashboard();
    showNotification(`${isReturningPlayer ? 'Welcome back' : 'Welcome'}, ${gameState.playerName}!`, 'success');
}

// ===== REDBUTTON REPORT FLOW =====
let currentReport = {};
let reportReason = '';
let reportDecisionTimer = null;

function showRedButtonReport() {
    document.getElementById('reportName').value = '';
    document.getElementById('reportAge').value = '';
    document.getElementById('reportAddress').value = '';
    document.getElementById('reportPhone').value = '';
    document.getElementById('reportPlatform').value = '';
    document.getElementById('reportPlatformUser').value = '';
    document.getElementById('reportReasonInput').value = '';
    document.getElementById('reportActionResult').innerHTML = '';
    document.getElementById('reportDecisionWrap').style.display = 'none';
    showModal('redButtonReportModal');
}

function submitReportDetails() {
    const name = document.getElementById('reportName').value.trim();
    const age = Number(document.getElementById('reportAge').value);
    const address = document.getElementById('reportAddress').value.trim();
    const phone = document.getElementById('reportPhone').value.trim();
    const platform = document.getElementById('reportPlatform').value;
    const platformUser = document.getElementById('reportPlatformUser').value.trim();

    if (!name && !age && !address && !phone && !platform && !platformUser) {
        showNotification('Please add at least some identity details or a platform username before continuing.', 'error');
        return;
    }

    if (age && (age < 1 || age > 120)) {
        showNotification('Age must be between 1 and 120.', 'error');
        return;
    }

    currentReport = {
        name: name || 'Unknown',
        age: age || 'Unknown',
        address: address || 'Unknown',
        phone: phone || 'Unknown',
        platform: platform || 'Unknown',
        platformUser: platformUser || 'Unknown'
    };

    closeModal('redButtonReportModal');
    document.getElementById('reportReasonInput').value = '';
    showModal('reportReasonModal');
}

function submitReportReason() {
    const reason = document.getElementById('reportReasonInput').value.trim();

    if (!reason) {
        showNotification('Please write a reason before continuing.', 'error');
        return;
    }

    reportReason = reason;
    closeModal('reportReasonModal');

    const reportSummary = `
        <p><strong>Name:</strong> ${currentReport.name}</p>
        <p><strong>Age:</strong> ${currentReport.age}</p>
        <p><strong>Address:</strong> ${currentReport.address}</p>
        <p><strong>Phone:</strong> ${currentReport.phone}</p>
        <p><strong>Platform:</strong> ${currentReport.platform}</p>
        <p><strong>User on platform:</strong> ${currentReport.platformUser}</p>
        <p><strong>Reason:</strong> ${reportReason}</p>
    `;

    document.getElementById('reportActionResult').innerHTML = reportSummary;
    document.getElementById('reportDecisionWrap').style.display = 'none';
    showModal('reportActionModal');
}

function dispatchEmergencyServices() {
    const address = currentReport.address || 'the location';
    const resultBox = document.getElementById('reportActionResult');
    resultBox.innerHTML = `<p>Dispatching emergency services to ${address}...</p>`;
    showNotification(`Emergency services are being prepared for ${address}.`, 'info');

    clearTimeout(reportDecisionTimer);
    reportDecisionTimer = setTimeout(() => {
        resultBox.innerHTML = `
            <p><strong>Dispatch complete.</strong> Emergency services have been notified for ${address}.</p>
            <p>The report summary has been logged for review.</p>
        `;
        showReportDecision('Do you want to submit this report to the safety desk?');
    }, 10000);
}

function runPrivacyCheck() {
    const resultBox = document.getElementById('reportActionResult');
    const randomAddress = getRandomAddress();
    const foundAddress = Math.random() < 0.9;

    clearTimeout(reportDecisionTimer);

    if (foundAddress) {
        resultBox.innerHTML = `
            <p><strong>Fictional trace result:</strong> ${randomAddress}</p>
            <p><strong>Platform:</strong> ${currentReport.platform || 'Unknown'}</p>
            <p><strong>Username:</strong> ${currentReport.platformUser || 'Unknown'}</p>
        `;
        showNotification('Fictional trace completed.', 'success');
    } else {
        resultBox.innerHTML = '<p><strong>Address could not be found.</strong> The fictional trace did not return a result.</p>';
        showNotification('Address could not be found.', 'warning');
    }

    showReportDecision('Do you want to submit this report to the safety desk?');
}

function getRandomAddress() {
    const addresses = [
        '17 Maple Street, Unit 2A',
        '92 Lake View Road',
        '44 Willow Lane, Apt 5C',
        '601 Garden Avenue',
        '8 Cedar Terrace',
        '221 Harbor Drive',
        '14 Pine Court, Floor 3',
        '70 Sunrise Boulevard'
    ];

    return addresses[Math.floor(Math.random() * addresses.length)];
}

function showReportDecision(question) {
    document.getElementById('reportDecisionQuestion').textContent = question;
    document.getElementById('reportDecisionWrap').style.display = 'block';
}

function handleReportDecision(accept) {
    if (accept) {
        showNotification('Report sent to the safety desk.', 'success');
    } else {
        showNotification('Report kept for later review.', 'info');
    }

    closeModal('reportActionModal');
    resetReportSession();
}

function resetReportSession() {
    currentReport = {};
    reportReason = '';
    clearTimeout(reportDecisionTimer);
}

// ===== PRISONER MANAGEMENT =====
function showAddPrisonerForm() {
    // Clear form
    document.getElementById('prisonerFirstName').value = '';
    document.getElementById('prisonerLastName').value = '';
    document.getElementById('prisonerAge').value = '';
    document.getElementById('prisonerReason').value = '';
    
    showModal('addPrisonerModal');
}

function proceedToCellSelection() {
    const firstName = document.getElementById('prisonerFirstName').value.trim();
    const lastName = document.getElementById('prisonerLastName').value.trim();
    const age = document.getElementById('prisonerAge').value;
    const reason = document.getElementById('prisonerReason').value.trim();

    if (!firstName || !lastName || !age || !reason) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (age < 18 || age > 100) {
        showNotification('Age must be between 18 and 100', 'error');
        return;
    }

    currentPrisonerData = {
        firstName,
        lastName,
        age: parseInt(age),
        reason
    };

    closeModal('addPrisonerModal');
    showModal('cellSelectionModal');
}

function selectCell(cellType) {
    const prisoner = {
        id: generateId(),
        firstName: currentPrisonerData.firstName,
        lastName: currentPrisonerData.lastName,
        age: currentPrisonerData.age,
        reason: currentPrisonerData.reason,
        cell: cellType,
        status: 'IN CELL',
        hunger: 100,
        escapeChance: getEscapeChance(cellType),
        securityLevel: getSecurityLevel(cellType),
        captured: false,
        searchActive: false,
        searchProgress: 0
    };

    gameState.prisoners.push(prisoner);
    updateStatistics();
    saveGameData();
    
    closeModal('cellSelectionModal');
    updateDashboard();
    showNotification(`${prisoner.firstName} ${prisoner.lastName} has been added to ${cellType} Cell`, 'success');
    
    currentPrisonerData = {};
}

function getEscapeChance(cellType) {
    const chances = {
        'Normal': 0.25,      // 25% chance
        'Medium': 0.12,      // 12% chance
        'Secured': 0.03      // 3% chance
    };
    return chances[cellType] || 0.1;
}

function getSecurityLevel(cellType) {
    const levels = {
        'Normal': 1,
        'Medium': 2,
        'Secured': 3
    };
    return levels[cellType] || 1;
}

// ===== PRISONER OPERATIONS =====
function openManagePrisoner(prisonerId) {
    const prisoner = gameState.prisoners.find(p => p.id === prisonerId);
    if (!prisoner) return;

    currentPrisonerId = prisonerId;

    document.getElementById('managePrisonerName').textContent = 
        `${prisoner.firstName} ${prisoner.lastName}`;
    document.getElementById('managePrisonerAge').textContent = prisoner.age;
    document.getElementById('managePrisonerCell').textContent = `${prisoner.cell} Cell`;
    document.getElementById('managePrisonerStatus').textContent = prisoner.status;
    document.getElementById('managePrisonerStatus').className = 
        `info-value status-badge status-${prisoner.status.replace(' ', '-')}`;
    document.getElementById('managePrisonerHunger').textContent = `${prisoner.hunger}%`;
    document.getElementById('managePrisonerSecurity').textContent = 
        ['Low', 'Medium', 'High'][prisoner.securityLevel - 1];
    document.getElementById('managePrisonerReason').textContent = prisoner.reason;

    // Show/hide helicopter button
    const helicopterBtn = document.getElementById('helicopterBtn');
    if (prisoner.status === 'ESCAPED') {
        helicopterBtn.style.display = 'inline-block';
    } else {
        helicopterBtn.style.display = 'none';
    }

    showModal('managePrisonerModal');
}

function givePrisonerFood() {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    if (!prisoner) return;

    if (prisoner.hunger >= 100) {
        showNotification('Prisoner is not hungry', 'info');
        return;
    }

    prisoner.hunger = Math.min(100, prisoner.hunger + 40);
    
    if (prisoner.status === 'HUNGRY') {
        prisoner.status = 'IN CELL';
    }

    saveGameData();
    openManagePrisoner(currentPrisonerId);
    showNotification('Food given to prisoner', 'success');
}

function inspectCell() {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    if (!prisoner) return;

    const results = [
        'Cell is clean.',
        'Suspicious object found.',
        'Damaged door found.',
        'Possible escape attempt.'
    ];

    const result = results[Math.floor(Math.random() * results.length)];
    
    showNotification(`Cell Inspection: ${result}`, 'info');
    
    if (result.includes('Damaged')) {
        prisoner.escapeChance = Math.min(0.8, prisoner.escapeChance + 0.1);
        saveGameData();
    }
}

function releasePrisoner() {
    pendingAction = 'RELEASE';
    showConfirmation(
        'Release Prisoner?',
        `Are you sure you want to release ${getFullName()} from prison?`
    );
}

function showExecuteConfirmation() {
    pendingAction = 'EXECUTE';
    showConfirmation(
        'WARNING: Execute Prisoner',
        'This is a fictional game mechanic. Are you sure you want to execute this prisoner? This action cannot be undone.'
    );
}

function showCellChangeOptions() {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    if (!prisoner) return;

    showModal('cellChangeModal');
}

function movePrisonerToCell(cellType) {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    if (!prisoner) return;

    prisoner.cell = cellType;
    prisoner.securityLevel = getSecurityLevel(cellType);
    prisoner.escapeChance = getEscapeChance(cellType);
    prisoner.status = prisoner.status === 'HUNGRY' ? 'HUNGRY' : 'IN CELL';

    saveGameData();
    closeModal('cellChangeModal');
    openManagePrisoner(currentPrisonerId);
    updateDashboard();
    showNotification(`${prisoner.firstName} ${prisoner.lastName} moved to ${cellType} Cell.`, 'success');
}

function confirmAction() {
    if (pendingAction === 'RELEASE') {
        const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
        if (prisoner) {
            prisoner.status = 'RELEASED';
            gameState.statistics.released++;
            updateStatistics();
            saveGameData();
            closeModal('managePrisonerModal');
            updateDashboard();
            showNotification(`${getFullName()} has been released`, 'success');
        }
    } else if (pendingAction === 'EXECUTE') {
        const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
        if (prisoner) {
            gameState.prisoners = gameState.prisoners.filter(p => p.id !== currentPrisonerId);
            updateStatistics();
            saveGameData();
            closeModal('managePrisonerModal');
            updateDashboard();
            showNotification(`${getFullName()} has been executed`, 'error');
        }
    }
    
    cancelAction();
}

function cancelAction() {
    pendingAction = null;
    closeModal('confirmationModal');
}

function showConfirmation(title, message) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    showModal('confirmationModal');
}

function getFullName() {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    return prisoner ? `${prisoner.firstName} ${prisoner.lastName}` : 'Prisoner';
}

// ===== ESCAPE SYSTEM =====
function checkPrisonerEscapes() {
    gameState.prisoners.forEach(prisoner => {
        if (prisoner.status !== 'IN CELL' && prisoner.status !== 'HUNGRY') return;
        
        if (Math.random() < prisoner.escapeChance) {
            prisoner.status = 'ESCAPED';
            prisoner.searchActive = false;
            prisoner.searchProgress = 0;
            
            showEscapeWarning(prisoner);
            saveGameData();
            updateDashboard();
            
            showNotification(`${prisoner.firstName} ${prisoner.lastName} has escaped!`, 'warning');
        }
    });
}

function showEscapeWarning(prisoner) {
    showModal('escapeWarningModal');
    
    setTimeout(() => {
        closeModal('escapeWarningModal');
    }, 3000);
}

// ===== HELICOPTER SEARCH SYSTEM =====
function sendHelicopters() {
    const prisoner = gameState.prisoners.find(p => p.id === currentPrisonerId);
    if (!prisoner || prisoner.status !== 'ESCAPED') return;

    prisoner.searchActive = true;
    prisoner.searchProgress = 0;
    prisoner.status = 'SEARCHING';
    
    saveGameData();
    showModal('searchOperationModal');
    
    closeModal('managePrisonerModal');

    let progress = 0;
    const searchInterval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        
        if (progress >= 100) {
            clearInterval(searchInterval);
            closeModal('searchOperationModal');
            
            // Random chance of finding the prisoner
            if (Math.random() < 0.7) {
                captureEscapedPrisoner(prisoner);
            } else {
                prisoner.searchActive = false;
                prisoner.status = 'ESCAPED';
                showNotification('Search operation unsuccessful. Prisoner still at large.', 'warning');
                saveGameData();
                updateDashboard();
            }
        }
    }, 1500);
}

function captureEscapedPrisoner(prisoner) {
    prisoner.status = 'CAPTURED';
    prisoner.searchActive = false;
    prisoner.cell = 'Medium';
    prisoner.escapeChance = getEscapeChance('Medium');
    
    saveGameData();
    updateDashboard();
    showNotification(`Guards have captured the escaped prisoner. ${prisoner.firstName} ${prisoner.lastName} has been moved to Medium Cell.`, 'success');
}

// ===== HUNGER SYSTEM =====
function updateHunger() {
    gameState.prisoners.forEach(prisoner => {
        if (prisoner.status === 'IN CELL') {
            prisoner.hunger = Math.max(0, prisoner.hunger - 5);
            
            if (prisoner.hunger < 30 && prisoner.status === 'IN CELL') {
                prisoner.status = 'HUNGRY';
            } else if (prisoner.hunger > 50 && prisoner.status === 'HUNGRY') {
                prisoner.status = 'IN CELL';
            }
        }
    });
    
    saveGameData();
}

// ===== RANDOM EVENTS =====
function triggerRandomEvent() {
    if (gameState.prisoners.length === 0) return;

    const events = [
        {
            name: 'Prisoner tried to escape',
            probability: 0.3
        },
        {
            name: 'Prisoner is hungry',
            probability: 0.25
        },
        {
            name: 'Cell inspection required',
            probability: 0.2
        },
        {
            name: 'Security camera detected suspicious movement',
            probability: 0.15
        },
        {
            name: 'Prisoner damaged the cell',
            probability: 0.1
        },
        {
            name: 'Prison alarm activated',
            probability: 0.08
        }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    
    if (Math.random() < event.probability) {
        showNotification(`🚨 ${event.name}`, 'warning');
    }

    // Update hunger gradually
    updateHunger();
}

// ===== DASHBOARD UPDATES =====
function updateDashboard() {
    updateStatistics();
    renderPrisonersList();
}

function updateStatistics() {
    gameState.statistics.totalPrisoners = gameState.prisoners.filter(
        p => p.status !== 'RELEASED'
    ).length;
    gameState.statistics.normalCells = gameState.prisoners.filter(
        p => p.cell === 'Normal' && p.status !== 'RELEASED'
    ).length;
    gameState.statistics.mediumCells = gameState.prisoners.filter(
        p => p.cell === 'Medium' && p.status !== 'RELEASED'
    ).length;
    gameState.statistics.securedCells = gameState.prisoners.filter(
        p => p.cell === 'Secured' && p.status !== 'RELEASED'
    ).length;
    gameState.statistics.escaped = gameState.prisoners.filter(
        p => p.status === 'ESCAPED'
    ).length;
    gameState.statistics.released = gameState.prisoners.filter(
        p => p.status === 'RELEASED'
    ).length;

    // Update DOM
    document.getElementById('totalPrisoners').textContent = gameState.statistics.totalPrisoners;
    document.getElementById('normalCells').textContent = gameState.statistics.normalCells;
    document.getElementById('mediumCells').textContent = gameState.statistics.mediumCells;
    document.getElementById('securedCells').textContent = gameState.statistics.securedCells;
    document.getElementById('escapedCount').textContent = gameState.statistics.escaped;
    document.getElementById('releasedCount').textContent = gameState.statistics.released;
}

function renderPrisonersList() {
    const container = document.getElementById('prisonersList');
    const noPrisonersMsg = document.getElementById('noPrisonersMessage');
    
    const activePrisoners = gameState.prisoners.filter(p => p.status !== 'RELEASED');
    
    if (activePrisoners.length === 0) {
        container.innerHTML = '';
        noPrisonersMsg.style.display = 'block';
        return;
    }

    noPrisonersMsg.style.display = 'none';
    
    container.innerHTML = activePrisoners.map(prisoner => `
        <div class="prisoner-card">
            <div class="prisoner-card-header">
                <div class="prisoner-name">${prisoner.firstName} ${prisoner.lastName}</div>
                <span class="status-badge status-${prisoner.status.replace(' ', '-')}">${prisoner.status}</span>
            </div>
            <div class="prisoner-info">
                <div class="info-row">
                    <strong>Age:</strong>
                    <span>${prisoner.age}</span>
                </div>
                <div class="info-row">
                    <strong>Cell:</strong>
                    <span>${prisoner.cell} Cell</span>
                </div>
                <div class="info-row">
                    <strong>Hunger:</strong>
                    <span>${prisoner.hunger}%</span>
                </div>
                <div class="hunger-bar">
                    <div class="hunger-bar-fill" style="width: ${prisoner.hunger}%"></div>
                </div>
                <div class="info-row">
                    <strong>Security:</strong>
                    <span>${['Low', 'Medium', 'High'][prisoner.securityLevel - 1]}</span>
                </div>
                <div class="info-row">
                    <strong>Reason:</strong>
                    <span>${prisoner.reason.substring(0, 30)}${prisoner.reason.length > 30 ? '...' : ''}</span>
                </div>
            </div>
            <div class="prisoner-actions">
                <button class="btn-manage-prisoner" onclick="openManagePrisoner('${prisoner.id}')">Manage Prisoner</button>
            </div>
        </div>
    `).join('');
}

// ===== FILTERING & SORTING =====
function filterPrisoners() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const cellFilter = document.getElementById('cellFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;

    let filtered = gameState.prisoners.filter(prisoner => {
        const matchesSearch = prisoner.firstName.toLowerCase().includes(searchTerm) ||
                            prisoner.lastName.toLowerCase().includes(searchTerm);
        const matchesCell = !cellFilter || prisoner.cell === cellFilter;
        const matchesStatus = !statusFilter || prisoner.status === statusFilter;

        return matchesSearch && matchesCell && matchesStatus && prisoner.status !== 'RELEASED';
    });

    // Sort
    if (sortBy === 'age') {
        filtered.sort((a, b) => a.age - b.age);
    } else if (sortBy === 'age-desc') {
        filtered.sort((a, b) => b.age - a.age);
    } else if (sortBy === 'security') {
        filtered.sort((a, b) => a.securityLevel - b.securityLevel);
    } else if (sortBy === 'security-desc') {
        filtered.sort((a, b) => b.securityLevel - a.securityLevel);
    }

    // Update display
    const container = document.getElementById('prisonersList');
    const noPrisonersMsg = document.getElementById('noPrisonersMessage');
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        noPrisonersMsg.style.display = 'block';
        return;
    }

    noPrisonersMsg.style.display = 'none';
    
    container.innerHTML = filtered.map(prisoner => `
        <div class="prisoner-card">
            <div class="prisoner-card-header">
                <div class="prisoner-name">${prisoner.firstName} ${prisoner.lastName}</div>
                <span class="status-badge status-${prisoner.status.replace(' ', '-')}">${prisoner.status}</span>
            </div>
            <div class="prisoner-info">
                <div class="info-row">
                    <strong>Age:</strong>
                    <span>${prisoner.age}</span>
                </div>
                <div class="info-row">
                    <strong>Cell:</strong>
                    <span>${prisoner.cell} Cell</span>
                </div>
                <div class="info-row">
                    <strong>Hunger:</strong>
                    <span>${prisoner.hunger}%</span>
                </div>
                <div class="hunger-bar">
                    <div class="hunger-bar-fill" style="width: ${prisoner.hunger}%"></div>
                </div>
                <div class="info-row">
                    <strong>Security:</strong>
                    <span>${['Low', 'Medium', 'High'][prisoner.securityLevel - 1]}</span>
                </div>
                <div class="info-row">
                    <strong>Reason:</strong>
                    <span>${prisoner.reason.substring(0, 30)}${prisoner.reason.length > 30 ? '...' : ''}</span>
                </div>
            </div>
            <div class="prisoner-actions">
                <button class="btn-manage-prisoner" onclick="openManagePrisoner('${prisoner.id}')">Manage Prisoner</button>
            </div>
        </div>
    `).join('');
}

// ===== NOTIFICATIONS =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// ===== LOCAL STORAGE =====
function getPlayerSaveKey(playerName, accountCode) {
    const baseName = (playerName || '').trim().toLowerCase();
    const code = (accountCode || '').trim();
    return `prisonRPPlayer_${baseName}_${code}`;
}

function saveGameData() {
    const playerName = (gameState.playerName || '').trim();
    const accountCode = (gameState.accountCode || '').trim();
    if (!playerName || !accountCode) return;

    const accountKey = getPlayerSaveKey(playerName, accountCode);
    localStorage.setItem(accountKey, JSON.stringify(gameState));
    localStorage.setItem('prisonRPGameState', JSON.stringify(gameState));
    localStorage.setItem('prisonRPCurrentPlayer', playerName);
    localStorage.setItem('prisonRPCurrentAccountCode', accountCode);
}

function loadPlayerProgress(playerName, accountCode) {
    const accountKey = getPlayerSaveKey(playerName, accountCode);
    const saved = localStorage.getItem(accountKey);
    if (!saved) {
        return null;
    }

    try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.playerName && parsed.accountCode === accountCode) {
            return parsed;
        }
    } catch (error) {
        console.warn('Failed to load saved player progress:', error);
    }

    return null;
}

function loadGameData() {
    const playerName = localStorage.getItem('prisonRPCurrentPlayer');
    const accountCode = localStorage.getItem('prisonRPCurrentAccountCode');
    if (!playerName || !accountCode) {
        return;
    }

    const saved = loadPlayerProgress(playerName, accountCode);
    if (saved) {
        gameState = saved;
        if (gameState.playerName) {
            document.getElementById('playerName').textContent = gameState.playerName;
        }
    }
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return 'prisoner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== MODAL MANAGEMENT =====
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Prevent body scroll when modal is open
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        // Modal handling
    }
});

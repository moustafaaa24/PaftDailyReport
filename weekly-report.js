// Configuration - Same as daily report
const SPREADSHEET_ID = '1JN_qNVXftCBSIedeNx1HzFAgjRYk_onh1PCMr-t9NQM';
const SHEET_URLS = {
    binLocation: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1314543807`,
    forklifts: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1512102468`,
    gates: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1123234426`,
    services: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1560847808`,
    wifiCoverage: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=659928693`,
    vm: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1126565793`,
    serverRoom: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1903997037`,
    network: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=235920846`,
    whatsappCharging: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1888422654`,
    security: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=172318027`
};

// Global variables
let charts = {};
let weeklyData = {};
let last5Days = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    calculateLast5Days();
    fetchWeeklyData();
});

// Calculate working days from Sunday to today (excluding Friday and Saturday)
function calculateLast5Days() {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    last5Days = [];
    
    // If today is Friday (5) or Saturday (6), don't show any data
    if (currentDay === 5 || currentDay === 6) {
        console.log('Today is Friday or Saturday - no data to show');
        updateWeekRangeDisplay();
        return;
    }
    
    // Calculate days from Sunday (start of week) to today
    // currentDay = 0 (Sunday), 1 (Monday), 2 (Tuesday), 3 (Wednesday), 4 (Thursday)
    
    // Find the most recent Sunday
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - currentDay);
    
    // Add all days from Sunday to today (excluding Friday and Saturday)
    for (let i = 0; i <= currentDay; i++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + i);
        const dayOfWeek = date.getDay();
        
        // Skip Friday (5) and Saturday (6)
        if (dayOfWeek !== 5 && dayOfWeek !== 6) {
            const dateStr = date.toISOString().split('T')[0];
            last5Days.push(dateStr);
        }
    }
    
    console.log('Working days (Sunday to today):', last5Days);
    updateWeekRangeDisplay();
}

// Update week range display
function updateWeekRangeDisplay() {
    const weekRangeEl = document.getElementById('weekRange');
    if (!weekRangeEl) return;
    
    if (last5Days.length === 0) {
        weekRangeEl.textContent = 'No data (Friday/Saturday)';
        return;
    }
    
    const startDate = new Date(last5Days[0]);
    const endDate = new Date(last5Days[last5Days.length - 1]);
    
    const options = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    weekRangeEl.textContent = `${startStr} - ${endStr} (${dayName})`;
}

// Fetch data for all 5 days
async function fetchWeeklyData() {
    console.log('Fetching weekly data...');
    showLoading(true);
    
    try {
        // Fetch all sheets
        const promises = Object.entries(SHEET_URLS).map(async ([key, url]) => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    console.warn(`Failed to fetch ${key}: ${response.status}`);
                    return [key, []];
                }
                const csvText = await response.text();
                
                return new Promise((resolve) => {
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            resolve([key, results.data]);
                        },
                        error: (error) => {
                            console.error(`Parse error for ${key}:`, error);
                            resolve([key, []]);
                        }
                    });
                });
            } catch (error) {
                console.error(`Error fetching ${key}:`, error);
                return [key, []];
            }
        });
        
        const results = await Promise.all(promises);
        const allRawData = Object.fromEntries(results);
        
        // Process data for each day
        weeklyData = {};
        last5Days.forEach(date => {
            weeklyData[date] = {};
            
            for (const [sheetName, rows] of Object.entries(allRawData)) {
                if (!rows || rows.length === 0) {
                    weeklyData[date][sheetName] = [];
                    continue;
                }
                
                // Check if this sheet has a Date column
                const firstRow = rows[0];
                const hasDateColumn = 'Date' in firstRow || 'date' in firstRow;
                
                if (!hasDateColumn) {
                    weeklyData[date][sheetName] = rows;
                } else {
                    // Filter by date
                    const filteredRows = rows.filter(row => {
                        const rowDate = row.Date || row.date || '';
                        if (!rowDate) return false;
                        const parsedDate = parseSheetDate(rowDate);
                        return parsedDate === date;
                    });
                    weeklyData[date][sheetName] = filteredRows;
                }
            }
        });
        
        console.log('Weekly data processed:', weeklyData);
        
        showLoading(false);
        processWeeklyData();
        
    } catch (error) {
        console.error('Error fetching weekly data:', error);
        showLoading(false);
        alert('Failed to fetch weekly data. Please check console for details.');
    }
}

// Show/hide loading
function showLoading(show) {
    const loadingEl = document.getElementById('loadingMessage');
    const dashboardEl = document.getElementById('dashboardGrid');
    
    if (loadingEl) loadingEl.style.display = show ? 'flex' : 'none';
    if (dashboardEl) dashboardEl.style.display = show ? 'none' : 'flex';
}

// Process weekly data and update dashboard
function processWeeklyData() {
    calculateBinsSummaryMetrics();
    updateBinsTrendCharts();
    updateWiFiUsageChart();
    updateWeeklySummaryTable();
}

// Calculate bins summary metrics - showing latest (most recent) data
function calculateBinsSummaryMetrics() {
    // Get the most recent day with data (last day in the 5-day range)
    let latestData = null;
    
    // Loop through days from most recent to oldest
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        
        if (dayData && dayData.binLocation && dayData.binLocation.length > 0) {
            latestData = dayData.binLocation[0];
            break;
        }
    }
    
    // Extract latest values
    let latestEnterLock = 0;
    let latestSpringRepair = 0;
    let latestScanningIssue = 0;
    let latestCement = 0;
    
    if (latestData) {
        latestEnterLock = parseInt(latestData['Needed Bins in EnterLock WH'] || 0);
        latestSpringRepair = parseInt(latestData['Row Material Spring Repair'] || 0);
        latestScanningIssue = parseInt(latestData['Row Material Issue in Scanning '] || latestData['Row Material Issue in Scanning'] || 0);
        latestCement = parseInt(latestData['Row Material need Cement'] || 0);
    }
    
    // Update summary cards with latest values
    document.getElementById('latestEnterLock').textContent = latestEnterLock;
    document.getElementById('latestSpringRepair').textContent = latestSpringRepair;
    document.getElementById('latestScanningIssue').textContent = latestScanningIssue;
    document.getElementById('latestCement').textContent = latestCement;
}

// Initialize charts
function initializeCharts() {
    // Damaged Enterlock Bins Trend Chart
    const enterLockCtx = document.getElementById('enterLockTrendChart');
    if (enterLockCtx) {
        charts.enterLockTrend = new Chart(enterLockCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Damaged Enterlock Bins',
                    data: [],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#dc3545',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#dc3545',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(220, 53, 69, 0.9)',
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return 'Damaged Bins: ' + context.parsed.y;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 49,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Number of Bins',
                            font: { size: 13, weight: 'bold' }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    // Row Material Trend Chart
    const rowMaterialCtx = document.getElementById('rowMaterialTrendChart');
    if (rowMaterialCtx) {
        charts.rowMaterialTrend = new Chart(rowMaterialCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Spring Repair',
                    data: [],
                    borderColor: '#FF6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Scanning Issues',
                    data: [],
                    borderColor: '#36A2EB',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Need Cement',
                    data: [],
                    borderColor: '#FFCE56',
                    backgroundColor: 'rgba(255, 206, 86, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Bins'
                        }
                    }
                }
            }
        });
    }
    

    // WiFi Usage Chart
    const wifiCtx = document.getElementById('wifiUsageChart');
    if (wifiCtx) {
        // Create gradient
        const gradient = wifiCtx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(29, 185, 232, 0.8)');
        gradient.addColorStop(1, 'rgba(29, 185, 232, 0.1)');
        
        charts.wifiUsage = new Chart(wifiCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily WiFi Usage',
                    data: [],
                    backgroundColor: 'rgba(29, 185, 232, 0.8)',
                    borderColor: '#1DB9E8',
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: { size: 12, weight: 'bold' },
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(29, 185, 232, 0.95)',
                        padding: 15,
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 14 },
                        borderColor: '#1DB9E8',
                        borderWidth: 2,
                        callbacks: {
                            label: function(context) {
                                return 'Usage: ' + context.parsed.y.toFixed(2) + ' GB';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12, weight: '500' },
                            callback: function(value) {
                                return value + ' GB';
                            }
                        },
                        title: {
                            display: true,
                            text: 'Usage (GB)',
                            font: { size: 14, weight: 'bold' },
                            padding: { bottom: 10 }
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: { size: 12, weight: '500' }
                        },
                        title: {
                            display: true,
                            text: 'Date',
                            font: { size: 14, weight: 'bold' },
                            padding: { top: 10 }
                        }
                    }
                }
            }
        });
    }
}

// Update bins trend charts
function updateBinsTrendCharts() {
    const labels = last5Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Bins trend data
    const enterLockData = [];
    const springRepairData = [];
    const scanningIssueData = [];
    const cementData = [];
    
    last5Days.forEach(date => {
        const dayData = weeklyData[date];
        
        if (dayData && dayData.binLocation && dayData.binLocation.length > 0) {
            const row = dayData.binLocation[0];
            
            enterLockData.push(parseInt(row['Needed Bins in EnterLock WH'] || 0));
            springRepairData.push(parseInt(row['Row Material Spring Repair'] || 0));
            scanningIssueData.push(parseInt(row['Row Material Issue in Scanning '] || row['Row Material Issue in Scanning'] || 0));
            cementData.push(parseInt(row['Row Material need Cement'] || 0));
        } else {
            enterLockData.push(0);
            springRepairData.push(0);
            scanningIssueData.push(0);
            cementData.push(0);
        }
    });
    
    // Update EnterLock chart
    if (charts.enterLockTrend) {
        charts.enterLockTrend.data.labels = labels;
        charts.enterLockTrend.data.datasets[0].data = enterLockData;
        charts.enterLockTrend.update();
    }
    
    // Update Row Material chart
    if (charts.rowMaterialTrend) {
        charts.rowMaterialTrend.data.labels = labels;
        charts.rowMaterialTrend.data.datasets[0].data = springRepairData;
        charts.rowMaterialTrend.data.datasets[1].data = scanningIssueData;
        charts.rowMaterialTrend.data.datasets[2].data = cementData;
        charts.rowMaterialTrend.update();
    }
}

// Update WiFi usage chart
function updateWiFiUsageChart() {
    if (!charts.wifiUsage) return;
    
    const labels = last5Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    
    // Calculate daily WiFi usage by subtracting previous day from current day
    const usageData = [];
    const dailyTotals = [];
    
    // First, collect cumulative totals for each day
    last5Days.forEach(date => {
        const dayData = weeklyData[date];
        
        if (dayData && dayData.network && dayData.network.length > 0) {
            const row = dayData.network[0];
            
            // Get router usage values (cumulative)
            const router1 = parseFloat(row['Router 1'] || row['WE router 1'] || 0);
            const router2 = parseFloat(row['Router 2'] || row['WE router 2'] || 0);
            const router3 = parseFloat(row['Router 3'] || row['WE router 3'] || 0);
            
            // Sum all routers for total cumulative usage
            const totalCumulative = router1 + router2 + router3;
            dailyTotals.push(totalCumulative);
        } else {
            dailyTotals.push(0);
        }
    });
    
    // Now calculate daily usage: current day total - next day total
    // For Nov 25: usage = total(Nov 25) - total(Nov 26)
    // For Nov 26: usage = total(Nov 26) - total(Nov 27)
    for (let i = 0; i < dailyTotals.length; i++) {
        if (i === dailyTotals.length - 1) {
            // Last day (most recent) - we can't calculate usage without next day
            // Use 0 or you could estimate based on average
            usageData.push(0);
        } else {
            // Daily usage = current day total - next day total
            const dailyUsage = dailyTotals[i] - dailyTotals[i + 1];
            usageData.push(dailyUsage >= 0 ? dailyUsage : 0);
        }
    }
    
    charts.wifiUsage.data.labels = labels;
    charts.wifiUsage.data.datasets[0].data = usageData;
    charts.wifiUsage.update();
}

// Update weekly summary table
function updateWeeklySummaryTable() {
    const tbody = document.querySelector('#weeklySummaryTable tbody');
    if (!tbody) return;
    
    // Get the latest (most recent) data
    let latestData = null;
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.binLocation && dayData.binLocation.length > 0) {
            latestData = dayData.binLocation[0];
            break;
        }
    }
    
    // Extract latest bins values
    let damagedBins = 0;
    let springRepair = 0;
    let scanningIssue = 0;
    let cement = 0;
    
    if (latestData) {
        damagedBins = parseInt(latestData['Needed Bins in EnterLock WH'] || 0);
        springRepair = parseInt(latestData['Row Material Spring Repair'] || 0);
        scanningIssue = parseInt(latestData['Row Material Issue in Scanning '] || latestData['Row Material Issue in Scanning'] || 0);
        cement = parseInt(latestData['Row Material need Cement'] || 0);
    }
    
    const totalRowMaterial = springRepair + scanningIssue + cement;
    
    // Calculate total WiFi usage across all days
    let totalWiFiUsage = 0;
    for (let i = 0; i < last5Days.length - 1; i++) {
        const currentDay = weeklyData[last5Days[i]];
        const nextDay = weeklyData[last5Days[i + 1]];
        
        if (currentDay?.network?.[0] && nextDay?.network?.[0]) {
            const currentTotal = (parseFloat(currentDay.network[0]['Router 1'] || 0) +
                                parseFloat(currentDay.network[0]['Router 2'] || 0) +
                                parseFloat(currentDay.network[0]['Router 3'] || 0));
            const nextTotal = (parseFloat(nextDay.network[0]['Router 1'] || 0) +
                             parseFloat(nextDay.network[0]['Router 2'] || 0) +
                             parseFloat(nextDay.network[0]['Router 3'] || 0));
            const dailyUsage = currentTotal - nextTotal;
            if (dailyUsage >= 0) {
                totalWiFiUsage += dailyUsage;
            }
        }
    }
    
    // Get gates status from latest day
    let gatesOperational = 0;
    let gatesWithIssues = 0;
    let gatesDown = 0;
    
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.gates && dayData.gates.length > 0) {
            const gatesRow = dayData.gates[0];
            Object.keys(gatesRow).forEach(key => {
                if (key !== 'Date' && key !== 'date') {
                    const status = (gatesRow[key] || '').toString().toLowerCase().trim();
                    if (status === 'good' || status === 'working' || status === 'operational') {
                        gatesOperational++;
                    } else if (status === 'down' || status === 'not working' || status === 'failed') {
                        gatesDown++;
                    } else if (status) {
                        gatesWithIssues++;
                    }
                }
            });
            break;
        }
    }
    
    // Build table rows
    const summaryData = [
        { metric: 'Working Days', value: last5Days.length, class: 'info' },
        { metric: 'Damaged Bins in Enterlock', value: damagedBins, class: 'danger' },
        { metric: 'Total Row Material Issues', value: totalRowMaterial, class: 'warning' },
        { metric: 'Spring Repair', value: springRepair, class: 'sub' },
        { metric: 'Scanning Issues', value: scanningIssue, class: 'sub' },
        { metric: 'Need Cement', value: cement, class: 'sub' },
        { metric: 'Total WiFi Usage', value: totalWiFiUsage.toFixed(1) + ' GB', class: 'primary' },
        { metric: 'Gates Status', value: '', class: 'info' },
        { metric: 'Operational', value: gatesOperational, class: 'sub success' },
        { metric: 'With Issues', value: gatesWithIssues, class: 'sub warning' },
        { metric: 'Down', value: gatesDown, class: 'sub danger' }
    ];
    
    tbody.innerHTML = summaryData.map(item => `
        <tr class="${item.class}">
            <td class="${item.class.includes('sub') ? 'sub-metric' : ''}">${item.metric}</td>
            <td><strong>${item.value}</strong></td>
        </tr>
    `).join('');
    
    // Update Services, VM, Forklifts, and Security tables
    updateServicesTable();
    updateVMTable();
    updateForkliftsTable();
    updateSecurityTable();
}

// Switch tab function
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.summary-tabs .nav-link').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('show', 'active');
    });
    
    // Activate selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Show selected tab pane
    const selectedPane = document.getElementById(tabName);
    if (selectedPane) {
        selectedPane.classList.add('show', 'active');
    }
}

// Update Services table
function updateServicesTable() {
    const tbody = document.querySelector('#servicesTable tbody');
    if (!tbody) return;
    
    // Get latest services data
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.services && dayData.services.length > 0) {
            const servicesRow = dayData.services[0];
            const services = [];
            
            Object.keys(servicesRow).forEach(key => {
                if (key !== 'Date' && key !== 'date') {
                    const status = servicesRow[key] || '';
                    const statusClass = getStatusClass(status);
                    services.push({ name: key, status: status, class: statusClass });
                }
            });
            
            tbody.innerHTML = services.map(service => `
                <tr>
                    <td>${service.name}</td>
                    <td><span class="status-badge ${service.class}">${service.status}</span></td>
                </tr>
            `).join('');
            break;
        }
    }
}

// Update VM table
function updateVMTable() {
    const tbody = document.querySelector('#vmTable tbody');
    if (!tbody) return;
    
    // Get latest VM data
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.vm && dayData.vm.length > 0) {
            const vmRow = dayData.vm[0];
            const vms = [];
            
            Object.keys(vmRow).forEach(key => {
                if (key !== 'Date' && key !== 'date') {
                    const status = vmRow[key] || '';
                    const statusClass = getStatusClass(status);
                    vms.push({ name: key, status: status, class: statusClass });
                }
            });
            
            tbody.innerHTML = vms.map(vm => `
                <tr>
                    <td>${vm.name}</td>
                    <td><span class="status-badge ${vm.class}">${vm.status}</span></td>
                </tr>
            `).join('');
            break;
        }
    }
}

// Update Forklifts table
function updateForkliftsTable() {
    const tbody = document.querySelector('#forkliftsTable tbody');
    if (!tbody) return;
    
    // Get latest forklifts data
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.forklifts && dayData.forklifts.length > 0) {
            const forkliftsRow = dayData.forklifts[0];
            const forklifts = [];
            
            Object.keys(forkliftsRow).forEach(key => {
                if (key !== 'Date' && key !== 'date') {
                    const status = forkliftsRow[key] || '';
                    const statusClass = getStatusClass(status);
                    forklifts.push({ name: key, status: status, class: statusClass });
                }
            });
            
            tbody.innerHTML = forklifts.map(forklift => `
                <tr>
                    <td>${forklift.name}</td>
                    <td><span class="status-badge ${forklift.class}">${forklift.status}</span></td>
                </tr>
            `).join('');
            break;
        }
    }
}

// Update Security table
function updateSecurityTable() {
    const tbody = document.querySelector('#securityTable tbody');
    if (!tbody) return;
    
    // Get latest security data
    for (let i = last5Days.length - 1; i >= 0; i--) {
        const date = last5Days[i];
        const dayData = weeklyData[date];
        if (dayData && dayData.security && dayData.security.length > 0) {
            const securityRow = dayData.security[0];
            const screens = [];
            
            Object.keys(securityRow).forEach(key => {
                if (key !== 'Date' && key !== 'date') {
                    const status = securityRow[key] || '';
                    const statusClass = getStatusClass(status);
                    screens.push({ name: key, status: status, class: statusClass });
                }
            });
            
            tbody.innerHTML = screens.map(screen => `
                <tr>
                    <td>${screen.name}</td>
                    <td><span class="status-badge ${screen.class}">${screen.status}</span></td>
                </tr>
            `).join('');
            break;
        }
    }
}

// Helper function for status class
function getStatusClass(status) {
    const statusLower = (status || '').toString().toLowerCase().trim();
    
    if (statusLower === 'good' || statusLower === 'ready' || statusLower === 'working' || 
        statusLower === 'operational' || statusLower === 'ok' || statusLower === 'online' || 
        statusLower === 'active' || statusLower === 'done' || statusLower === 'completed') {
        return 'good';
    }
    
    if (statusLower === 'not working' || statusLower === 'notworking' || statusLower === 'down' || 
        statusLower === 'not done' || statusLower === 'notdone' || statusLower === 'error' || 
        statusLower === 'failed' || statusLower === 'offline' || statusLower === 'deleted' || 
        statusLower === 'damaged' || statusLower === 'broken' || statusLower === 'critical' || 
        statusLower === 'not ready' || statusLower === 'notready') {
        return 'bad';
    }
    
    return 'warning';
}

// Update bins insights
function updateBinsInsights() {
    const container = document.getElementById('keyInsights');
    if (!container) return;
    
    const insights = [];
    
    // Analyze trends
    const firstDay = weeklyData[last5Days[0]];
    const lastDay = weeklyData[last5Days[last5Days.length - 1]];
    
    // Damaged Enterlock bins trend
    if (firstDay?.binLocation?.[0] && lastDay?.binLocation?.[0]) {
        const firstEnterLock = parseInt(firstDay.binLocation[0]['Needed Bins in EnterLock WH'] || 0);
        const lastEnterLock = parseInt(lastDay.binLocation[0]['Needed Bins in EnterLock WH'] || 0);
        
        if (lastEnterLock > firstEnterLock) {
            insights.push({
                icon: 'fa-arrow-up',
                text: `Damaged Enterlock bins increased from ${firstEnterLock} to ${lastEnterLock} (${lastEnterLock - firstEnterLock} more damaged bins).`
            });
        } else if (lastEnterLock < firstEnterLock) {
            insights.push({
                icon: 'fa-arrow-down',
                text: `Damaged Enterlock bins decreased from ${firstEnterLock} to ${lastEnterLock} (${firstEnterLock - lastEnterLock} fewer damaged bins).`
            });
        } else {
            insights.push({
                icon: 'fa-minus',
                text: `Damaged Enterlock bins remained stable at ${lastEnterLock} throughout the week.`
            });
        }
    }
    
    // Row Material issues analysis - Total across 5 days
    let totalSpringRepair = 0;
    let totalScanningIssue = 0;
    let totalCement = 0;
    let daysWithData = 0;
    
    last5Days.forEach(date => {
        const dayData = weeklyData[date];
        if (dayData?.binLocation?.[0]) {
            const row = dayData.binLocation[0];
            totalSpringRepair += parseInt(row['Row Material Spring Repair'] || 0);
            totalScanningIssue += parseInt(row['Row Material Issue in Scanning '] || row['Row Material Issue in Scanning'] || 0);
            totalCement += parseInt(row['Row Material need Cement'] || 0);
            daysWithData++;
        }
    });
    
    const totalRowMaterial = totalSpringRepair + totalScanningIssue + totalCement;
    
    if (daysWithData > 0) {
        // Find the most common issue
        const issues = [
            { name: 'Spring Repair', count: totalSpringRepair },
            { name: 'Scanning Issues', count: totalScanningIssue },
            { name: 'Need Cement', count: totalCement }
        ].sort((a, b) => b.count - a.count);
        
        if (issues[0].count > 0) {
            insights.push({
                icon: 'fa-exclamation-circle',
                text: `${issues[0].name} is the most common row material issue with ${issues[0].count} total bins affected over 5 days.`
            });
        }
        
        // Latest row material status
        if (lastDay?.binLocation?.[0]) {
            const latestSpring = parseInt(lastDay.binLocation[0]['Row Material Spring Repair'] || 0);
            const latestScanning = parseInt(lastDay.binLocation[0]['Row Material Issue in Scanning '] || lastDay.binLocation[0]['Row Material Issue in Scanning'] || 0);
            const latestCement = parseInt(lastDay.binLocation[0]['Row Material need Cement'] || 0);
            const latestTotal = latestSpring + latestScanning + latestCement;
            
            if (latestTotal > 10) {
                insights.push({
                    icon: 'fa-exclamation-triangle',
                    text: `Currently ${latestTotal} row material bins with issues. Consider maintenance review.`
                });
            } else if (latestTotal > 0) {
                insights.push({
                    icon: 'fa-info-circle',
                    text: `Currently ${latestTotal} row material bins with issues.`
                });
            } else {
                insights.push({
                    icon: 'fa-check-circle',
                    text: `No row material issues in the latest report!`
                });
            }
        }
    }
    
    // Damaged Enterlock capacity analysis
    if (lastDay?.binLocation?.[0]) {
        const lastEnterLock = parseInt(lastDay.binLocation[0]['Needed Bins in EnterLock WH'] || 0);
        const capacity = 42;
        const percentage = (lastEnterLock / capacity * 100).toFixed(1);
        
        if (lastEnterLock >= 35) {
            insights.push({
                icon: 'fa-exclamation-triangle',
                text: `Damaged Enterlock bins at ${percentage}% of capacity (${lastEnterLock}/${capacity}). Consider urgent action.`
            });
        } else if (lastEnterLock >= 25) {
            insights.push({
                icon: 'fa-info-circle',
                text: `Damaged Enterlock bins at ${percentage}% of capacity (${lastEnterLock}/${capacity}).`
            });
        }
    }
    
    // Default insight if none generated
    if (insights.length === 0) {
        insights.push({
            icon: 'fa-check-circle',
            text: 'All bins are operating within normal parameters.'
        });
    }
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-item">
            <p><i class="fas ${insight.icon}"></i> ${insight.text}</p>
        </div>
    `).join('');
}

// Update bins daily breakdown
function updateBinsDailyBreakdown() {
    const container = document.getElementById('dailyBreakdown');
    if (!container) return;
    
    container.innerHTML = last5Days.map(date => {
        const dayData = weeklyData[date];
        const dateObj = new Date(date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        // Calculate bins metrics for this day
        let enterLock = 0;
        let springRepair = 0;
        let scanningIssue = 0;
        let cement = 0;
        
        if (dayData && dayData.binLocation && dayData.binLocation.length > 0) {
            const row = dayData.binLocation[0];
            enterLock = parseInt(row['Needed Bins in EnterLock WH'] || 0);
            springRepair = parseInt(row['Row Material Spring Repair'] || 0);
            scanningIssue = parseInt(row['Row Material Issue in Scanning '] || row['Row Material Issue in Scanning'] || 0);
            cement = parseInt(row['Row Material need Cement'] || 0);
        }
        
        const totalRowMaterial = springRepair + scanningIssue + cement;
        const enterLockPercent = ((enterLock / 42) * 100).toFixed(1);
        
        // Determine status based on EnterLock capacity
        let statusClass = 'bg-success';
        let statusText = 'Good';
        if (enterLock >= 35) {
            statusClass = 'bg-danger';
            statusText = 'Critical';
        } else if (enterLock >= 25) {
            statusClass = 'bg-warning';
            statusText = 'Warning';
        }
        
        return `
            <div class="day-card">
                <div class="day-header">
                    <h6>${dayName}</h6>
                    <div class="day-status">
                        <span class="badge ${statusClass}">${statusText}</span>
                        <span class="badge bg-secondary">${enterLockPercent}% Full</span>
                    </div>
                </div>
                <div class="day-content">
                    <div class="day-metric">
                        <label><i class="fas fa-box"></i> Damaged Enterlock Bins</label>
                        <span class="text-primary">${enterLock} / 42</span>
                    </div>
                    <div class="day-metric">
                        <label><i class="fas fa-tools"></i> Spring Repair</label>
                        <span class="text-danger">${springRepair}</span>
                    </div>
                    <div class="day-metric">
                        <label><i class="fas fa-barcode"></i> Scanning Issues</label>
                        <span class="text-info">${scanningIssue}</span>
                    </div>
                    <div class="day-metric">
                        <label><i class="fas fa-fill-drip"></i> Need Cement</label>
                        <span class="text-success">${cement}</span>
                    </div>
                    <div class="day-metric">
                        <label><strong>Total Row Material</strong></label>
                        <span><strong>${totalRowMaterial}</strong></span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Helper functions
function parseSheetDate(dateStr) {
    if (!dateStr) return null;
    try {
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return null;
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    } catch (error) {
        return null;
    }
}

function isGoodStatus(status) {
    const statusLower = (status || '').toString().toLowerCase().trim();
    return statusLower === 'good' || 
           statusLower === 'ready' || 
           statusLower === 'working' || 
           statusLower === 'operational' || 
           statusLower === 'ok' ||
           statusLower === 'online' ||
           statusLower === 'active' ||
           statusLower === 'done' ||
           statusLower === 'completed';
}

// Refresh data
function refreshData() {
    fetchWeeklyData();
    
    const btn = document.querySelector('.btn-refresh');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            btn.disabled = false;
        }, 2000);
    }
}

// Print report
function printReport() {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
        document.body.classList.remove('printing');
    }, 1000);
}

// Configuration - Multiple Sheet URLs
// Using direct spreadsheet ID with GID for each sheet
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

const REFRESH_INTERVAL = 60000; // 60 seconds

// Global chart instances
let charts = {};
let allData = {};
let allRawData = {}; // Store raw data before filtering
let selectedDate = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    fetchAllData();
    setInterval(fetchAllData, REFRESH_INTERVAL);
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    selectedDate = today;
    updateDateDisplay();
});

// Fetch data from all sheets
async function fetchAllData() {
    console.log('Fetching data from all sheets...');
    
    try {
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
                            console.log(`${key} data:`, results.data);
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
        allRawData = Object.fromEntries(results);
        
        console.log('All data fetched:', allRawData);
        
        // Check if we got any data
        let hasData = false;
        for (const key in allRawData) {
            if (allRawData[key] && allRawData[key].length > 0) {
                hasData = true;
                break;
            }
        }
        
        if (!hasData) {
            console.warn('⚠️ No data received from any sheets! Check if sheets are published.');
            console.log('Sheet URLs:', SHEET_URLS);
        } else {
            console.log('✅ Data received successfully!');
        }
        
        // Apply date filter if selected
        applyDateFilter();
        updateLastUpdateTime();
        
    } catch (error) {
        console.error('❌ Error fetching all data:', error);
        alert('Failed to fetch data from Google Sheets. Please check console for details.');
    }
}

// Update dashboard with all data
function updateDashboard() {
    console.log('Updating dashboard...');
    
    // Update each section with data from respective sheets
    updateBins(allData.binLocation || []);
    updateForklifts(allData.forklifts || []);
    updateGates(allData.gates || []);
    updateServices(allData.services || []);
    updateWiFiCoverage(allData.wifiCoverage || []);
    updateVirtualMachines(allData.vm || []);
    updateServerRoom(allData.serverRoom || []);
    updateNetwork(allData.network || []);
    updateWhatsAppCharging(allData.whatsappCharging || []);
    updateSecurity(allData.security || []);
    updateCameras(allData.serverRoom || []); // Cameras might be in server room sheet
    
    console.log('Dashboard updated!');
}

// Initialize all charts
function initializeCharts() {
    // Plugin to display text in center of doughnut chart
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart) => {
            if (chart.config.options.plugins.centerText) {
                const ctx = chart.ctx;
                const centerX = chart.chartArea.left + (chart.chartArea.right - chart.chartArea.left) / 2;
                const centerY = chart.chartArea.top + (chart.chartArea.bottom - chart.chartArea.top) / 2;
                
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = 'bold 28px Arial';
                ctx.fillStyle = '#4A90E2';
                ctx.fillText(chart.config.options.plugins.centerText.text, centerX, centerY);
                ctx.restore();
            }
        }
    };
    
    // Register the plugin
    Chart.register(centerTextPlugin);
    
    // Router charts (gauge style)
    ['router1', 'router2', 'router3'].forEach(id => {
        const ctx = document.getElementById(`${id}Chart`);
        if (ctx) {
            charts[id] = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [0, 100],
                        backgroundColor: ['#4A90E2', '#e0e0e0'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: false },
                        centerText: {
                            text: '0%'
                        }
                    }
                }
            });
        }
    });

    // Row Materials chart (donut)
    const rowMaterialsCtx = document.getElementById('rowMaterialsChart');
    if (rowMaterialsCtx) {
        charts.rowMaterials = new Chart(rowMaterialsCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        align: 'center',
                        fullSize: true,
                        labels: { 
                            padding: 12,
                            font: { size: 11 },
                            boxWidth: 18,
                            boxHeight: 12,
                            usePointStyle: false
                        },
                        display: true,
                        maxHeight: 50
                    }
                },
                layout: {
                    padding: {
                        bottom: 10
                    }
                }
            }
        });
    }

    // Bins chart (semi-circle gauge)
    const binsCtx = document.getElementById('binsChart');
    if (binsCtx) {
        charts.bins = new Chart(binsCtx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#dc3545', '#e0e0e0'], // Red color for damaged bins
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                rotation: -90,
                circumference: 180,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }
}

// Update Bins
function updateBins(data) {
    console.log('📦 Updating bins with:', data);
    if (!data || data.length === 0) {
        console.warn('⚠️ No bins data received');
        return;
    }
    
    // Data is in first row
    const row = data[0];
    console.log('Bins row data:', row);
    
    const fgWh = parseInt(row['FG WH'] || row['tags have been removed'] || 0);
    const enterLock = parseInt(row['Needed Bins in EnterLock WH'] || 0);
    const goodBins = parseInt(row['Good Bins in EnterLock WH'] || row['Good Bins'] || 0);
    const rowMaterialWH = parseInt(row['Row Material WH'] || 0);
    
    console.log(`Bins values - FG WH: ${fgWh}, EnterLock: ${enterLock}, Good Bins: ${goodBins}, Row Material WH: ${rowMaterialWH}`);
    
    // Update bins chart with EnterLock data
    if (charts.bins && enterLock !== undefined) {
        const MAX_BINS = 49; // Maximum capacity of 49 bins
        const percentage = Math.min(100, (enterLock / MAX_BINS) * 100);
        charts.bins.data.datasets[0].data = [percentage, 100 - percentage];
        charts.bins.update();
        
        const statusEl = document.getElementById('binsStatus');
        if (statusEl) {
            statusEl.innerHTML = `<strong>${enterLock}/${MAX_BINS} Bins</strong><br>${percentage.toFixed(1)}% Damaged<br>EnterLock WH`;
        }
        console.log(`✅ Bins chart updated: ${enterLock}/${MAX_BINS} = ${percentage.toFixed(1)}%`);
    }
    
    // Update row materials chart
    const springRepair = parseInt(row['Row Material Spring Repair'] || 0);
    const scanningIssue = parseInt(row['Row Material Issue in Scanning '] || row['Row Material Issue in Scanning'] || 0);
    const cement = parseInt(row['Row Material need Cement'] || 0);
    
    console.log(`Row Materials - Spring: ${springRepair}, Scanning: ${scanningIssue}, Cement: ${cement}`);
    
    if (charts.rowMaterials && (springRepair || scanningIssue || cement)) {
        const TOTAL_ROW_MATERIALS = 42; // Total capacity
        const total = springRepair + scanningIssue + cement;
        
        // Calculate percentages based on total of 42
        const springPercent = (springRepair / TOTAL_ROW_MATERIALS) * 100;
        const scanningPercent = (scanningIssue / TOTAL_ROW_MATERIALS) * 100;
        const cementPercent = (cement / TOTAL_ROW_MATERIALS) * 100;
        
        charts.rowMaterials.data.labels = [
            `Spring Repair (${springRepair})`,
            `Scanning Issue (${scanningIssue})`,
            `Cement (${cement})`
        ];
        charts.rowMaterials.data.datasets[0].data = [springPercent, scanningPercent, cementPercent];
        charts.rowMaterials.update();
        
        // Update total display
        const totalEl = document.getElementById('rowMaterialsTotal');
        if (totalEl) {
            totalEl.innerHTML = `<strong>Total: ${total}/${TOTAL_ROW_MATERIALS}</strong>`;
        }
        
        console.log(`✅ Row Materials chart updated: Total ${total}/${TOTAL_ROW_MATERIALS}`);
    }
}

// Update Forklifts
function updateForklifts(data) {
    console.log('Updating forklifts with:', data);
    const tbody = document.querySelector('#forkliftTable tbody');
    if (!tbody || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const forkliftData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            forkliftData.push({
                type: header,
                status: values[header]
            });
        }
    });
    
    tbody.innerHTML = forkliftData.map(forklift => {
        const statusClass = getStatusClass(forklift.status);
        return `
            <tr>
                <td>${forklift.type}</td>
                <td><span class="status-badge ${statusClass}">${forklift.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Update Gates
function updateGates(data) {
    console.log('Updating gates with:', data);
    const container = document.getElementById('gatesStatus');
    if (!container || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const gateData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            gateData.push({
                name: header,
                status: values[header]
            });
        }
    });
    
    container.innerHTML = gateData.map(gate => {
        const statusClass = getStatusClass(gate.status);
        return `
            <div class="status-item ${statusClass}">
                <h6>${gate.name}</h6>
                <p>${gate.status}</p>
            </div>
        `;
    }).join('');
}

// Update Services
function updateServices(data) {
    console.log('Updating services with:', data);
    const container = document.getElementById('servicesStatus');
    if (!container || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const serviceData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            serviceData.push({
                name: header,
                status: values[header]
            });
        }
    });
    
    container.innerHTML = serviceData.map(service => {
        const statusClass = getStatusClass(service.status);
        return `
            <div class="status-item ${statusClass}">
                <h6>${service.name}</h6>
                <p>${service.status}</p>
            </div>
        `;
    }).join('');
}

// Update WiFi Coverage
function updateWiFiCoverage(data) {
    console.log('Updating WiFi coverage with:', data);
    const container = document.getElementById('wifiCoverage');
    if (!container || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const wifiData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            const coverage = parseFloat(values[header]);
            if (!isNaN(coverage)) {
                wifiData.push({
                    area: header,
                    coverage: coverage
                });
            }
        }
    });
    
    container.innerHTML = wifiData.map(item => {
        const statusClass = item.coverage >= 80 ? 'good' : item.coverage >= 50 ? 'warning' : 'bad';
        return `
            <div class="wifi-item ${statusClass}">
                <div>${item.area}</div>
                <div style="font-size: 1.2rem;">${item.coverage}%</div>
            </div>
        `;
    }).join('');
}

// Update Virtual Machines
function updateVirtualMachines(data) {
    console.log('Updating VMs with:', data);
    const tbody = document.querySelector('#vmTable tbody');
    if (!tbody || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const vmData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            vmData.push({
                system: header,
                status: values[header]
            });
        }
    });
    
    tbody.innerHTML = vmData.map(vm => {
        const statusClass = getStatusClass(vm.status);
        return `
            <tr>
                <td>${vm.system}</td>
                <td><span class="status-badge ${statusClass}">${vm.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Update Server Room
function updateServerRoom(data) {
    console.log('Updating server room with:', data);
    const container = document.getElementById('serverRoom');
    if (!container || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const deviceData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            deviceData.push({
                name: header,
                status: values[header]
            });
        }
    });
    
    container.innerHTML = deviceData.map(device => {
        const statusClass = getStatusClass(device.status);
        return `
            <div class="status-item ${statusClass}">
                <h6>${device.name}</h6>
                <p>${device.status}</p>
            </div>
        `;
    }).join('');
}

// Update Network (Routers)
function updateNetwork(data) {
    console.log('Updating network with:', data);
    
    // If no data, show default values
    if (!data || data.length === 0) {
        console.log('No network data available for selected date');
        
        // Reset routers to 0
        for (let i = 1; i <= 3; i++) {
            if (charts[`router${i}`]) {
                charts[`router${i}`].data.datasets[0].data = [0, 100];
                charts[`router${i}`].options.plugins.centerText.text = '0%';
                charts[`router${i}`].update();
            }
            const statusEl = document.getElementById(`router${i}Status`);
            if (statusEl) statusEl.innerHTML = '--';
        }
        
        // Reset WiFi Speed
        const uploadEl = document.getElementById('uploadSpeed');
        const downloadEl = document.getElementById('downloadSpeed');
        if (uploadEl) uploadEl.textContent = '--';
        if (downloadEl) downloadEl.textContent = '--';
        
        return;
    }
    
    // Data is horizontal
    const row = data[0];
    
    // Extract router data
    const router1GB = parseFloat(row['Router 1'] || row['WE router 1'] || 0);
    const router2GB = parseFloat(row['Router 2'] || row['WE router 2'] || 0);
    const router3GB = parseFloat(row['Router 3'] || row['WE router 3'] || 0);
    
    const routers = [
        { gb: router1GB, status: row['Static IP'] || 'Good' },
        { gb: router2GB, status: 'Good' },
        { gb: router3GB, status: 'Good' }
    ];
    
    const MAX_ROUTER_GB = 400; // Maximum capacity for each router
    
    routers.forEach((router, index) => {
        const routerNum = index + 1;
        // Calculate percentage based on 400 GB maximum
        const percentage = Math.min(100, (router.gb / MAX_ROUTER_GB) * 100);
        
        if (charts[`router${routerNum}`]) {
            // Update chart data
            charts[`router${routerNum}`].data.datasets[0].data = [percentage, 100 - percentage];
            // Update center text with percentage
            charts[`router${routerNum}`].options.plugins.centerText.text = `${Math.round(percentage)}%`;
            charts[`router${routerNum}`].update();
        }
        
        const statusEl = document.getElementById(`router${routerNum}Status`);
        if (statusEl) {
            statusEl.innerHTML = `${router.gb} GB`;
        }
        console.log(`Router ${routerNum}: ${router.gb} GB - ${router.status}`);
    });
    
    // Update WiFi Speed if available
    const uploadSpeed = parseFloat(row['overall PAFT wifi speed Upload2'] || row['overall PAFT wifi speed Upload'] || 0);
    const downloadSpeed = parseFloat(row['overall PAFT wifi speed Download'] || 0);
    
    const uploadEl = document.getElementById('uploadSpeed');
    const downloadEl = document.getElementById('downloadSpeed');
    
    if (uploadEl) {
        uploadEl.textContent = uploadSpeed ? `${uploadSpeed} Mbps` : '--';
    }
    if (downloadEl) {
        downloadEl.textContent = downloadSpeed ? `${downloadSpeed} Mbps` : '--';
    }
}

// Update Cameras
function updateCameras(data) {
    console.log('Updating cameras with:', data);
    if (!data || data.length === 0) return;
    
    // Try to find camera data in any sheet
    const row = data[0];
    const headers = Object.keys(row);
    
    let working = 0;
    let down = 0;
    
    // Look for camera-related fields
    headers.forEach(header => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('camera') && lowerHeader.includes('working')) {
            working = parseInt(row[header]) || 0;
        } else if (lowerHeader.includes('camera') && lowerHeader.includes('down')) {
            down = parseInt(row[header]) || 0;
        }
    });
    
    const workingEl = document.getElementById('camerasWorking');
    const downEl = document.getElementById('camerasDown');
    
    if (workingEl) workingEl.textContent = working || '48';
    if (downEl) downEl.textContent = down || '3';
}

// Update WhatsApp & Charging
function updateWhatsAppCharging(data) {
    console.log('Updating WhatsApp & Charging with:', data);
    // This can be part of services or separate
    updateServices(data);
}

// Update Security
function updateSecurity(data) {
    console.log('Updating security with:', data);
    const container = document.getElementById('securityScreens');
    if (!container || !data || data.length === 0) return;
    
    // Data is horizontal: headers in row 0, values in row 1
    const headers = Object.keys(data[0]);
    const values = data[0];
    
    const securityData = [];
    headers.forEach(header => {
        // Skip Date column
        if (header && values[header] && !isDateColumn(header)) {
            securityData.push({
                name: header,
                status: values[header]
            });
        }
    });
    
    container.innerHTML = securityData.map(screen => {
        const statusClass = getStatusClass(screen.status);
        return `
            <div class="status-item ${statusClass}">
                <h6>${screen.name}</h6>
                <p>${screen.status}</p>
            </div>
        `;
    }).join('');
}

// Helper function to check if a column is a date column
function isDateColumn(columnName) {
    const lowerName = (columnName || '').toLowerCase().trim();
    return lowerName === 'date' || lowerName === 'dates' || lowerName === 'timestamp';
}

// Helper function to determine status class
function getStatusClass(status) {
    const statusLower = (status || '').toString().toLowerCase().trim();
    
    // Good statuses (GREEN)
    if (statusLower === 'good' || 
        statusLower === 'ready' || 
        statusLower === 'working' || 
        statusLower === 'operational' || 
        statusLower === 'ok' ||
        statusLower === 'online' ||
        statusLower === 'active' ||
        statusLower === 'done' ||
        statusLower === 'completed') {
        return 'good';
    }
    
    // Bad statuses (RED)
    if (statusLower === 'not working' ||
        statusLower === 'notworking' ||
        statusLower === 'down' || 
        statusLower === 'not done' || 
        statusLower === 'notdone' ||
        statusLower === 'error' || 
        statusLower === 'failed' || 
        statusLower === 'offline' || 
        statusLower === 'deleted' || 
        statusLower === 'damaged' ||
        statusLower === 'broken' ||
        statusLower === 'critical' ||
        statusLower === 'not ready' ||
        statusLower === 'notready' ||
        statusLower.includes('not working') ||
        statusLower.includes('not done') ||
        statusLower.includes('camera is down') ||
        statusLower.includes('cameras is down') ||
        statusLower.includes('camera down') ||
        statusLower.includes('cameras down') ||
        /\d+\s*camera.*down/.test(statusLower) ||
        /\d+\s*cameras.*down/.test(statusLower)) {
        return 'bad';
    }
    
    // Warning statuses (YELLOW)
    if (statusLower === 'unstable' || 
        statusLower === 'warning' || 
        statusLower === 'pending' ||
        statusLower === 'maintenance' ||
        statusLower === 'degraded') {
        return 'warning';
    }
    
    // Default to warning for unknown statuses
    return 'warning';
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('en-US', options);
    const lastUpdateEl = document.getElementById('lastUpdate');
    if (lastUpdateEl) {
        lastUpdateEl.textContent = dateTimeString;
    }
}

// Manual refresh function
function refreshData() {
    fetchAllData();
    
    // Add visual feedback
    const btn = document.querySelector('.btn-refresh');
    if (btn) {
        btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            btn.disabled = false;
        }, 1000);
    }
}

// Print report as PDF
function printReport() {
    // Add print-specific styling
    document.body.classList.add('printing');
    
    // Trigger browser print dialog
    window.print();
    
    // Remove print styling after print dialog closes
    setTimeout(() => {
        document.body.classList.remove('printing');
    }, 1000);
}

// Date filtering functions
function filterByDate() {
    const dateInput = document.getElementById('dateFilter');
    selectedDate = dateInput.value;
    console.log('Filtering by date:', selectedDate);
    updateDateDisplay();
    applyDateFilter();
}

function clearDateFilter() {
    // Set to today instead of clearing
    const today = new Date().toISOString().split('T')[0];
    selectedDate = today;
    document.getElementById('dateFilter').value = today;
    console.log('Date filter reset to today');
    updateDateDisplay();
    applyDateFilter();
}

function updateDateDisplay() {
    const dateRelativeEl = document.getElementById('dateRelative');
    if (!dateRelativeEl) return;
    
    // If no date selected, default to today
    if (!selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        selectedDate = today;
        document.getElementById('dateFilter').value = today;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selected = new Date(selectedDate + 'T00:00:00');
    selected.setHours(0, 0, 0, 0);
    
    const diffTime = today - selected;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        dateRelativeEl.textContent = 'Today';
    } else if (diffDays === 1) {
        dateRelativeEl.textContent = 'Yesterday';
    } else if (diffDays === -1) {
        dateRelativeEl.textContent = 'Tomorrow';
    } else if (diffDays > 1 && diffDays <= 30) {
        dateRelativeEl.textContent = `${diffDays} days ago`;
    } else if (diffDays < -1 && diffDays >= -30) {
        dateRelativeEl.textContent = `In ${Math.abs(diffDays)} days`;
    } else if (diffDays > 30) {
        const weeks = Math.floor(diffDays / 7);
        const months = Math.floor(diffDays / 30);
        if (months > 0) {
            dateRelativeEl.textContent = `${months} month${months > 1 ? 's' : ''} ago`;
        } else {
            dateRelativeEl.textContent = `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
    } else {
        dateRelativeEl.textContent = selected.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
}

function applyDateFilter() {
    // If no date selected, default to today
    if (!selectedDate) {
        const today = new Date().toISOString().split('T')[0];
        selectedDate = today;
        document.getElementById('dateFilter').value = today;
        updateDateDisplay();
    }
    
    // Filter data by selected date
    allData = {};
    
    for (const [sheetName, rows] of Object.entries(allRawData)) {
        if (!rows || rows.length === 0) {
            allData[sheetName] = [];
            continue;
        }
        
        // Check if this sheet has a Date column
        const firstRow = rows[0];
        const hasDateColumn = 'Date' in firstRow || 'date' in firstRow;
        
        if (!hasDateColumn) {
            // No date column, include all data
            allData[sheetName] = rows;
            console.log(`${sheetName}: No date column, including all data`);
        } else {
            // Filter by date
            const filteredRows = rows.filter(row => {
                const rowDate = row.Date || row.date || '';
                if (!rowDate) return false;
                
                // Parse the date from the row (format: M/D/YYYY)
                const parsedDate = parseSheetDate(rowDate);
                if (!parsedDate) return false;
                
                // Compare with selected date
                return parsedDate === selectedDate;
            });
            
            allData[sheetName] = filteredRows;
            console.log(`${sheetName}: Filtered ${filteredRows.length} rows for date ${selectedDate}`);
        }
    }
    
    checkDataAvailability();
    updateDashboard();
}

function checkDataAvailability() {
    const noDataMessage = document.getElementById('noDataMessage');
    const dashboardGrid = document.getElementById('dashboardGrid');
    
    if (!noDataMessage || !dashboardGrid) return;
    
    // Check if we have any data
    let hasAnyData = false;
    for (const [sheetName, rows] of Object.entries(allData)) {
        if (rows && rows.length > 0) {
            hasAnyData = true;
            break;
        }
    }
    
    if (!hasAnyData && selectedDate) {
        // Check if selected date is Friday or Saturday
        const selectedDateObj = new Date(selectedDate + 'T00:00:00');
        const dayOfWeek = selectedDateObj.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
        
        // Update message based on day
        const messageTitle = noDataMessage.querySelector('h2');
        const messageText = noDataMessage.querySelector('p');
        
        if (dayOfWeek === 5) {
            // Friday
            if (messageTitle) messageTitle.textContent = 'No IT Check in Friday';
            if (messageText) messageText.textContent = 'IT checks are not performed on Fridays. Please select another date.';
        } else if (dayOfWeek === 6) {
            // Saturday
            if (messageTitle) messageTitle.textContent = 'No IT Check in Saturday';
            if (messageText) messageText.textContent = 'IT checks are not performed on Saturdays. Please select another date.';
        } else {
            // Other days - default message
            if (messageTitle) messageTitle.textContent = 'This Date Is Still Pending';
            if (messageText) messageText.textContent = 'No data available for the selected date. Please choose another date or check back later.';
        }
        
        // No data for selected date - show message
        noDataMessage.style.display = 'flex';
        dashboardGrid.style.display = 'none';
        console.log('⚠️ No data available for selected date');
    } else {
        // Has data - show dashboard
        noDataMessage.style.display = 'none';
        dashboardGrid.style.display = 'flex';
    }
}

function parseSheetDate(dateStr) {
    // Parse date from format like "11/25/2025" to "2025-11-25"
    if (!dateStr) return null;
    
    try {
        const parts = dateStr.trim().split('/');
        if (parts.length !== 3) return null;
        
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        const year = parts[2];
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return null;
    }
}

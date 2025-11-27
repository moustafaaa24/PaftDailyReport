// Configuration
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vREO_TfwQ7BPyW07MQkJKxs_61LyaDAqU_0iubwwm-w69VGOHVpXZ8zkDIZQKZnE1PGFZHXXvEEblWs/pub?output=csv';
const REFRESH_INTERVAL = 60000; // 60 seconds

// Global chart instances
let charts = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    fetchData();
    setInterval(fetchData, REFRESH_INTERVAL);
});

// Fetch data from Google Sheets
async function fetchData() {
    try {
        console.log('Fetching data from:', SHEET_URL);
        const response = await fetch(SHEET_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('CSV data received, length:', csvText.length);
        console.log('First 500 characters:', csvText.substring(0, 500));
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                console.log('Parsed data:', results.data);
                console.log('Number of rows:', results.data.length);
                if (results.data.length > 0) {
                    console.log('First row:', results.data[0]);
                    console.log('Column headers:', Object.keys(results.data[0]));
                }
                processData(results.data);
                updateLastUpdateTime();
            },
            error: (error) => {
                console.error('Papa Parse error:', error);
            }
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data from Google Sheets. Check console for details.');
    }
}

// Process and update dashboard with data
function processData(data) {
    console.log('Processing data...');
    
    if (!data || data.length === 0) {
        console.warn('No data to process!');
        return;
    }
    
    // Group data by category
    const categories = {};
    data.forEach(row => {
        const category = row.Category || row.category || '';
        if (category) {
            if (!categories[category]) {
                categories[category] = [];
            }
            categories[category].push(row);
        }
    });

    console.log('Categories found:', Object.keys(categories));
    console.log('Category data:', categories);

    // Update each section
    updateRouters(categories['Routers'] || []);
    updateWiFiCoverage(categories['WiFi Coverage'] || []);
    updateWiFiSpeed(categories['WiFi Speed'] || []);
    updateVirtualMachines(categories['Virtual Machines'] || []);
    updateRowMaterials(categories['Row Materials'] || []);
    updateForklifts(categories['Forklifts'] || []);
    updateGates(categories['Gates'] || []);
    updateCameras(categories['Cameras'] || []);
    updateServerRoom(categories['Server Room'] || []);
    updateServices(categories['Services'] || []);
    updateBins(categories['Bins'] || []);
    updateSecurityScreens(categories['Security Screens'] || []);
    
    console.log('Dashboard updated successfully!');
}

// Initialize all charts
function initializeCharts() {
    // Router charts (gauge style)
    ['router1', 'router2', 'router3'].forEach(id => {
        const ctx = document.getElementById(`${id}Chart`);
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
                    tooltip: { enabled: false }
                }
            }
        });
    });

    // Row Materials chart (donut)
    const rowMaterialsCtx = document.getElementById('rowMaterialsChart');
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
                    labels: { padding: 15, font: { size: 11 } }
                }
            }
        }
    });

    // Bins chart (semi-circle gauge)
    const binsCtx = document.getElementById('binsChart');
    charts.bins = new Chart(binsCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#28a745', '#e0e0e0'],
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

// Update Routers
function updateRouters(data) {
    data.forEach((router, index) => {
        const routerNum = index + 1;
        const usage = parseFloat(router.Usage || router.usage || 0);
        const status = router.Status || router.status || '';
        
        if (charts[`router${routerNum}`]) {
            charts[`router${routerNum}`].data.datasets[0].data = [usage, 100 - usage];
            charts[`router${routerNum}`].update();
        }
        
        const statusEl = document.getElementById(`router${routerNum}Status`);
        if (statusEl) {
            statusEl.innerHTML = `<strong>${usage} GB</strong><br>${status}`;
        }
    });
}

// Update WiFi Coverage
function updateWiFiCoverage(data) {
    const container = document.getElementById('wifiCoverage');
    container.innerHTML = data.map(item => {
        const area = item.Area || item.area || '';
        const coverage = parseFloat(item.Coverage || item.coverage || 0);
        const statusClass = coverage >= 80 ? 'good' : coverage >= 50 ? 'warning' : 'bad';
        
        return `
            <div class="wifi-item ${statusClass}">
                <div>${area}</div>
                <div style="font-size: 1.2rem;">${coverage}%</div>
            </div>
        `;
    }).join('');
}

// Update WiFi Speed
function updateWiFiSpeed(data) {
    if (data.length > 0) {
        const upload = data.find(d => (d.Type || d.type || '').toLowerCase().includes('upload'));
        const download = data.find(d => (d.Type || d.type || '').toLowerCase().includes('download'));
        
        if (upload) {
            document.getElementById('uploadSpeed').textContent = `${upload.Speed || upload.speed || '--'} Mbps`;
        }
        if (download) {
            document.getElementById('downloadSpeed').textContent = `${download.Speed || download.speed || '--'} Mbps`;
        }
    }
}

// Update Virtual Machines
function updateVirtualMachines(data) {
    const tbody = document.querySelector('#vmTable tbody');
    tbody.innerHTML = data.map(vm => {
        const system = vm.System || vm.system || '';
        const status = vm.Status || vm.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <tr>
                <td>${system}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// Update Row Materials
function updateRowMaterials(data) {
    const labels = data.map(item => item.Issue || item.issue || '');
    const values = data.map(item => parseFloat(item.Count || item.count || 0));
    
    charts.rowMaterials.data.labels = labels;
    charts.rowMaterials.data.datasets[0].data = values;
    charts.rowMaterials.update();
}

// Update Forklifts
function updateForklifts(data) {
    const tbody = document.querySelector('#forkliftTable tbody');
    tbody.innerHTML = data.map(forklift => {
        const type = forklift.Type || forklift.type || '';
        const status = forklift.Status || forklift.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <tr>
                <td>${type}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
            </tr>
        `;
    }).join('');
}

// Update Gates
function updateGates(data) {
    const container = document.getElementById('gatesStatus');
    container.innerHTML = data.map(gate => {
        const name = gate.Name || gate.name || '';
        const status = gate.Status || gate.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <div class="status-item ${statusClass}">
                <h6>${name}</h6>
                <p>${status}</p>
            </div>
        `;
    }).join('');
}

// Update Cameras
// function updateCameras(data) {
//     if (data.length > 0) {
//         const working = data.find(d => (d.Type || d.type || '').toLowerCase().includes('working'));
//         const down = data.find(d => (d.Type || d.type || '').toLowerCase().includes('down'));
        
//         if (working) {
//             document.getElementById('camerasWorking').textContent = working.Count || working.count || '0';
//         }
//         if (down) {
//             document.getElementById('camerasDown').textContent = down.Count || down.count || '0';
//         }
//     }
// }

// Update Server Room
function updateServerRoom(data) {
    const container = document.getElementById('serverRoom');
    container.innerHTML = data.map(device => {
        const name = device.Device || device.device || '';
        const status = device.Status || device.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <div class="status-item ${statusClass}">
                <h6>${name}</h6>
                <p>${status}</p>
            </div>
        `;
    }).join('');
}

// Update Services
function updateServices(data) {
    const container = document.getElementById('servicesStatus');
    container.innerHTML = data.map(service => {
        const name = service.Service || service.service || '';
        const status = service.Status || service.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <div class="status-item ${statusClass}">
                <h6>${name}</h6>
                <p>${status}</p>
            </div>
        `;
    }).join('');
}

// Update Bins
function updateBins(data) {
    if (data.length > 0) {
        const percentage = parseFloat(data[0].Percentage || data[0].percentage || 0);
        const status = data[0].Status || data[0].status || '';
        
        charts.bins.data.datasets[0].data = [percentage, 100 - percentage];
        charts.bins.update();
        
        document.getElementById('binsStatus').innerHTML = `<strong>${percentage}%</strong><br>${status}`;
    }
}

// Update Security Screens
function updateSecurityScreens(data) {
    const container = document.getElementById('securityScreens');
    container.innerHTML = data.map(screen => {
        const name = screen.Screen || screen.screen || '';
        const status = screen.Status || screen.status || '';
        const statusClass = getStatusClass(status);
        
        return `
            <div class="status-item ${statusClass}">
                <h6>${name}</h6>
                <p>${status}</p>
            </div>
        `;
    }).join('');
}

// Helper function to determine status class
function getStatusClass(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('good') || statusLower.includes('ready') || statusLower.includes('working') || statusLower.includes('operational')) {
        return 'good';
    } else if (statusLower.includes('unstable') || statusLower.includes('not ready') || statusLower.includes('warning')) {
        return 'warning';
    } else if (statusLower.includes('down') || statusLower.includes('not done') || statusLower.includes('error') || statusLower.includes('failed')) {
        return 'bad';
    }
    return 'warning';
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdate').textContent = timeString;
}

// Manual refresh function
function refreshData() {
    fetchData();
    
    // Add visual feedback
    const btn = document.querySelector('.btn-refresh');
    btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refreshing...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        btn.disabled = false;
    }, 1000);
}

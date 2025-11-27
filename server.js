const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.static('.'));

// Google Spreadsheet configuration
const SPREADSHEET_ID = '1JN_qNVXftCBSIedeNx1HzFAgjRYk_onh1PCMr-t9NQM';
const SHEET_GIDS = {
    binLocation: 1314543807,
    forklifts: 1512102468,
    gates: 1123234426,
    services: 1560847808,
    wifiCoverage: 659928693,
    vm: 1126565793,
    serverRoom: 1903997037,
    network: 235920846,
    whatsappCharging: 1888422654,
    security: 172318027
};

// Cache configuration
let cachedData = {};
let lastFetchTime = {};
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to fetch a single sheet
function fetchSheet(gid) {
    return new Promise((resolve, reject) => {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
        
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                resolve(data);
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// API endpoint to fetch specific sheet
app.get('/api/sheet/:name', async (req, res) => {
    const sheetName = req.params.name;
    const gid = SHEET_GIDS[sheetName];
    
    if (!gid) {
        return res.status(404).json({ error: 'Sheet not found' });
    }
    
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedData[sheetName] && (now - (lastFetchTime[sheetName] || 0)) < CACHE_DURATION) {
        console.log(`Returning cached data for ${sheetName}`);
        return res.send(cachedData[sheetName]);
    }
    
    // Fetch fresh data
    try {
        console.log(`Fetching fresh data for ${sheetName}...`);
        const data = await fetchSheet(gid);
        cachedData[sheetName] = data;
        lastFetchTime[sheetName] = now;
        console.log(`Data fetched and cached for ${sheetName}`);
        res.send(data);
    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        res.status(500).json({ error: `Failed to fetch ${sheetName}` });
    }
});

// API endpoint to fetch all sheets
app.get('/api/sheets/all', async (req, res) => {
    try {
        console.log('Fetching all sheets...');
        const promises = Object.entries(SHEET_GIDS).map(async ([name, gid]) => {
            const data = await fetchSheet(gid);
            return [name, data];
        });
        
        const results = await Promise.all(promises);
        const allData = Object.fromEntries(results);
        
        console.log('All sheets fetched successfully');
        res.json(allData);
    } catch (error) {
        console.error('Error fetching all sheets:', error);
        res.status(500).json({ error: 'Failed to fetch sheets' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        sheets: Object.keys(SHEET_GIDS),
        cachedSheets: Object.keys(cachedData)
    });
});

// Start server - Listen on all network interfaces for LAN access
app.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Find the local IP address
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIP = iface.address;
                break;
            }
        }
    }
    
    console.log(`
╔════════════════════════════════════════════════╗
║   IT Daily Report Dashboard Server             ║
╠════════════════════════════════════════════════╣
║   Local: http://localhost:${PORT}              ║
║   Network: http://${localIP}:${PORT}           ║
║   Dashboard: http://${localIP}:${PORT}/index.html ║
║   API: http://${localIP}:${PORT}/api/sheets/all   ║
║   Health: http://${localIP}:${PORT}/api/health    ║
╠════════════════════════════════════════════════╣
║🌐 LAN Access Enabled!                          ║
║   Share the Network URL with your team         ║
╚════════════════════════════════════════════════╝
    `);
    console.log('✅ Server is ready and accessible on your local network!\n');
    console.log('⚠️  Make sure Windows Firewall allows Node.js on port', PORT);
    console.log('   Go to: Windows Defender Firewall → Allow an app\n');
});

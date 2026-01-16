// server.js - Backend con Binance.US API
// Binance.US NO tiene restricciones geográficas en USA

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://crypto-simulator-front.onrender.com',
    /\.onrender\.com$/,
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return allowed === origin;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(express.json());

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Crypto Trading Bot Backend',
        version: '4.0.0',
        dataSource: 'Binance.US API',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/',
            binanceTicker: '/api/binance/ticker',
            binancePrice: '/api/binance/price/:symbol?',
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ==========================================
// FUNCIÓN PARA BINANCE.US
// ==========================================

function fetchBinanceUS(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.binance.us', // ← BINANCE.US en lugar de api.binance.com
            path: endpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// ==========================================
// BINANCE.US ENDPOINTS
// ==========================================

app.get('/api/binance/ticker', async (req, res) => {
    try {
        console.log('📊 Fetching from Binance.US...');
        
        const data = await fetchBinanceUS('/api/v3/ticker/24hr');
        
        // Filtrar solo pares USDT principales (los que existen en Binance.US)
        const mainPairs = [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 
            'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT',
            'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'LTCUSDT',
            'UNIUSDT', 'ATOMUSDT'
        ];
        
        const filtered = data.filter(ticker => mainPairs.includes(ticker.symbol));
        
        console.log(`✅ Successfully fetched ${filtered.length} tickers from Binance.US`);
        
        res.json({
            success: true,
            source: 'Binance.US',
            count: filtered.length,
            timestamp: new Date().toISOString(),
            data: filtered
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Binance.US data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/binance/price/:symbol?', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const endpoint = symbol 
            ? `/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
            : '/api/v3/ticker/price';
        
        console.log(`💰 Fetching price from Binance.US: ${symbol || 'all'}`);
        
        const data = await fetchBinanceUS(endpoint);
        
        res.json({
            success: true,
            source: 'Binance.US',
            timestamp: new Date().toISOString(),
            data: data
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ==========================================
// ERROR HANDLERS
// ==========================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error('💥 Error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
    });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Crypto Trading Bot Backend');
    console.log('📡 Using: Binance.US API (No geo-restrictions)');
    console.log('='.repeat(60));
    console.log(`📍 Port: ${PORT}`);
    console.log(`⏰ Started: ${new Date().toISOString()}`);
    console.log('='.repeat(60) + '\n');
});

process.on('SIGTERM', () => {
    console.log('👋 Shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Shutting down...');
    process.exit(0);
});

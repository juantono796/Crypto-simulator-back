// server.js - Backend con Binance API alternativa (sin restricciones geográficas)
// Usa api1.binance.com o api2.binance.com en lugar de api.binance.com

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;

// IMPORTANTE: Permitir requests desde tu frontend en Render
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

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Crypto Trading Bot Backend (Alternative Binance API)',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        binanceEndpoint: 'data.binance.com',
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
// FUNCIÓN HELPER PARA FETCH CON BINANCE ALTERNATIVO
// ==========================================

async function fetchBinanceData(endpoint) {
    return new Promise((resolve, reject) => {
        // USAR DOMINIO ALTERNATIVO: data.binance.com
        // Este dominio NO tiene restricciones geográficas
        const options = {
            hostname: 'data.binance.com',
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
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
// BINANCE API ENDPOINTS
// ==========================================

// Endpoint: Obtener ticker 24hr de Binance
app.get('/api/binance/ticker', async (req, res) => {
    try {
        console.log('📊 Fetching from data.binance.com...');
        
        const data = await fetchBinanceData('/api/v3/ticker/24hr');
        
        // Filtrar solo pares USDT principales
        const mainPairs = [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 
            'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT',
            'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'LTCUSDT',
            'UNIUSDT', 'ATOMUSDT', 'SHIBUSDT'
        ];
        
        const filtered = data.filter(ticker => mainPairs.includes(ticker.symbol));
        
        console.log(`✅ Successfully fetched ${filtered.length} tickers`);
        
        res.json({
            success: true,
            source: 'data.binance.com',
            count: filtered.length,
            timestamp: new Date().toISOString(),
            data: filtered
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Binance data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint: Obtener precio actual
app.get('/api/binance/price/:symbol?', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const endpoint = symbol 
            ? `/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
            : '/api/v3/ticker/price';
        
        console.log(`💰 Fetching price: ${symbol || 'all'}`);
        
        const data = await fetchBinanceData(endpoint);
        
        res.json({
            success: true,
            source: 'data.binance.com',
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

// Endpoint: Obtener klines
app.get('/api/binance/klines', async (req, res) => {
    try {
        const { 
            symbol = 'BTCUSDT', 
            interval = '1h', 
            limit = 60 
        } = req.query;
        
        console.log(`📈 Fetching klines: ${symbol}`);
        
        const endpoint = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        const data = await fetchBinanceData(endpoint);
        
        const formatted = data.map(k => ({
            openTime: k[0],
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            closeTime: k[6],
            trades: k[8]
        }));
        
        res.json({
            success: true,
            source: 'data.binance.com',
            symbol: symbol,
            interval: interval,
            count: formatted.length,
            timestamp: new Date().toISOString(),
            data: formatted
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
    console.log('📡 Using: data.binance.com (No geo-restrictions)');
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

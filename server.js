// server.js - Backend para Crypto Trading Bot
// Deploy en Render como Web Service

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// IMPORTANTE: Permitir requests desde tu frontend en Render
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://crypto-bot-frontend.onrender.com', // Cambia esto por tu URL de frontend
    /\.onrender\.com$/, // Permite todos los subdominios de render
];

app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (como Postman, curl, etc)
        if (!origin) return callback(null, true);
        
        // Verificar si el origin está permitido
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
    console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    next();
});

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Crypto Trading Bot Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/',
            binanceTicker: '/api/binance/ticker',
            binancePrice: '/api/binance/price/:symbol?',
            binanceKlines: '/api/binance/klines',
        }
    });
});

// Health check alternativo
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ==========================================
// BINANCE API ENDPOINTS
// ==========================================

// Endpoint: Obtener ticker 24hr de Binance
app.get('/api/binance/ticker', async (req, res) => {
    try {
        console.log('📊 Fetching Binance ticker data...');
        
        const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
        
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filtrar solo pares USDT principales
        const mainPairs = [
            'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 
            'XRPUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOGEUSDT',
            'DOTUSDT', 'MATICUSDT', 'LINKUSDT', 'LTCUSDT',
            'UNIUSDT', 'ATOMUSDT', 'SHIBUSDT'
        ];
        
        const filtered = data.filter(ticker => mainPairs.includes(ticker.symbol));
        
        console.log(`✅ Returning ${filtered.length} tickers`);
        
        res.json({
            success: true,
            count: filtered.length,
            timestamp: new Date().toISOString(),
            data: filtered
        });
        
    } catch (error) {
        console.error('❌ Error fetching Binance ticker:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Binance data',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint: Obtener precio actual de una o todas las criptos
app.get('/api/binance/price/:symbol?', async (req, res) => {
    try {
        const { symbol } = req.params;
        
        const url = symbol 
            ? `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`
            : 'https://api.binance.com/api/v3/ticker/price';
        
        console.log(`💰 Fetching price for: ${symbol || 'all'}`);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: data
        });
        
    } catch (error) {
        console.error('❌ Error fetching price:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint: Obtener histórico de velas (klines)
app.get('/api/binance/klines', async (req, res) => {
    try {
        const { 
            symbol = 'BTCUSDT', 
            interval = '1h', 
            limit = 60 
        } = req.query;
        
        console.log(`📈 Fetching klines for ${symbol} (${interval}, limit: ${limit})`);
        
        const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transformar a formato más amigable
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
            symbol: symbol,
            interval: interval,
            count: formatted.length,
            timestamp: new Date().toISOString(),
            data: formatted
        });
        
    } catch (error) {
        console.error('❌ Error fetching klines:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint: Obtener información del exchange
app.get('/api/binance/exchangeInfo', async (req, res) => {
    try {
        console.log('ℹ️ Fetching exchange info...');
        
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        
        if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Solo devolver info de los pares principales
        const mainPairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
        const symbols = data.symbols.filter(s => mainPairs.includes(s.symbol));
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            timezone: data.timezone,
            serverTime: data.serverTime,
            symbols: symbols
        });
        
    } catch (error) {
        console.error('❌ Error fetching exchange info:', error.message);
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

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        availableEndpoints: {
            health: '/',
            binanceTicker: '/api/binance/ticker',
            binancePrice: '/api/binance/price/:symbol?',
            binanceKlines: '/api/binance/klines',
            exchangeInfo: '/api/binance/exchangeInfo'
        }
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
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
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Crypto Trading Bot Backend');
    console.log('='.repeat(50));
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log('='.repeat(50) + '\n');
    console.log('📋 Available endpoints:');
    console.log(`   GET  /                           - Health check`);
    console.log(`   GET  /api/binance/ticker         - 24hr ticker data`);
    console.log(`   GET  /api/binance/price/:symbol  - Current price`);
    console.log(`   GET  /api/binance/klines         - Historical data`);
    console.log(`   GET  /api/binance/exchangeInfo   - Exchange info`);
    console.log('\n' + '='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

# 🚀 Crypto Trading Bot - Backend

Backend API para el Crypto Trading Bot con integración a Binance.

## 📋 Características

- ✅ Integración directa con Binance API
- ✅ CORS configurado para el frontend
- ✅ Endpoints RESTful
- ✅ Manejo de errores robusto
- ✅ Logging completo
- ✅ Health checks

## 🔌 Endpoints Disponibles

### Health Check
```
GET /
GET /health
```

### Binance Ticker (24hr)
```
GET /api/binance/ticker
```
Retorna datos de las 15 criptomonedas principales con precio, volumen, cambio 24h, etc.

### Precio Actual
```
GET /api/binance/price/:symbol?
```
Ejemplos:
- `GET /api/binance/price/BTCUSDT` - Precio de BTC
- `GET /api/binance/price` - Precios de todas

### Histórico (Klines)
```
GET /api/binance/klines?symbol=BTCUSDT&interval=1h&limit=60
```
Parámetros:
- `symbol`: Par de trading (default: BTCUSDT)
- `interval`: 1m, 5m, 15m, 1h, 4h, 1d (default: 1h)
- `limit`: Número de velas (default: 60)

### Exchange Info
```
GET /api/binance/exchangeInfo
```

## 🚀 Deploy en Render

### 1. Preparar Repositorio

```bash
cd crypto-bot-backend
git init
git add .
git commit -m "Initial commit: Backend API"
git remote add origin https://github.com/tu-usuario/crypto-bot-backend.git
git push -u origin main
```

### 2. Crear Web Service en Render

1. Ve a [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Conecta tu repositorio `crypto-bot-backend`
4. Configuración:
   ```
   Name: crypto-bot-backend
   Region: Oregon (o el más cercano)
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```
5. Click **Create Web Service**

### 3. Obtener URL

Tu backend estará en:
```
https://crypto-bot-backend.onrender.com
```

### 4. Verificar

Abre la URL en el navegador. Deberías ver:
```json
{
  "status": "ok",
  "message": "Crypto Trading Bot Backend",
  "version": "1.0.0",
  ...
}
```

### 5. Configurar CORS

En `server.js`, línea 14, actualiza con tu URL de frontend:

```javascript
const allowedOrigins = [
    'https://tu-frontend.onrender.com', // ← Tu URL de frontend
    /\.onrender\.com$/,
];
```

Luego:
```bash
git add server.js
git commit -m "Update CORS origins"
git push origin main
```

Render re-deployará automáticamente.

## 🧪 Testing Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# El servidor estará en http://localhost:3001
```

### Probar endpoints:

```bash
# Health check
curl http://localhost:3001/

# Ticker
curl http://localhost:3001/api/binance/ticker

# Precio específico
curl http://localhost:3001/api/binance/price/BTCUSDT

# Klines
curl "http://localhost:3001/api/binance/klines?symbol=ETHUSDT&interval=1h&limit=24"
```

## 📊 Respuestas de la API

### Formato de éxito:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": [...]
}
```

### Formato de error:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Seguridad

### CORS
El backend está configurado para aceptar requests solo de:
- `localhost` (desarrollo)
- Tu dominio de frontend en Render
- Subdominios de `.onrender.com`

### Rate Limiting
Binance tiene límites de:
- 1200 requests/minuto (peso)
- 20 requests/segundo

El backend no implementa rate limiting propio, confía en los límites de Binance.

## 🐛 Troubleshooting

### Error: "Not allowed by CORS"
**Solución:** Agrega tu dominio de frontend en `allowedOrigins` en server.js

### Error: "Binance API error: 429"
**Solución:** Estás haciendo demasiadas peticiones. Espera 1 minuto.

### Error: "Cannot GET /api/..."
**Solución:** Verifica la ruta. Revisa la lista de endpoints disponibles.

## 📝 Variables de Entorno

No necesitas variables de entorno. El puerto lo asigna Render automáticamente.

Si en el futuro necesitas agregar:

```bash
# En Render Dashboard → Environment
PORT=3001
NODE_ENV=production
```

## 🔄 Auto-Deploy

Cada vez que hagas push a GitHub:

```bash
git add .
git commit -m "Update: mejoras en el backend"
git push origin main
```

Render detecta el cambio y re-deploya automáticamente (~2 min).

## 📊 Monitoring

### Ver logs:
En Render Dashboard → Tu servicio → **Logs**

### Métricas:
En Render Dashboard → Tu servicio → **Metrics**

## ⚡ Performance

### Latencia esperada:
```
Frontend → Backend: ~50-100ms
Backend → Binance: ~50-100ms
Total: ~100-200ms
```

### Caching (futuro):
Considera agregar caching con Redis si necesitas reducir llamadas a Binance.

## 📞 Soporte

¿Problemas? 
1. Revisa los logs en Render
2. Verifica que el backend esté running
3. Prueba los endpoints con curl
4. Abre un issue en GitHub

## ⚖️ Licencia

MIT

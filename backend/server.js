// ★★★ NEW DEBUGGING CODE START ★★★
console.log('--- server.js script started execution (TOP OF FILE) ---'); // スクリプト実行開始をログ
// ★★★ NEW DEBUGGING CODE END ★★★

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const heicConvert = require('heic-convert');

const app = express();
const port = process.env.PORT || 3001; 
const uploadDir = './uploads'; 

if (!fs.existsSync(uploadDir)) { 
    fs.mkdirSync(uploadDir); 
} 

// デバッグ用GETルート - このまま残します
app.get('/test-cors', (req, res) => {
  console.log('--- /test-cors route hit ---');
  console.log('Request Origin:', req.headers.origin); 
  
  res.setHeader('Access-Control-Allow-Origin', 'https://matsuishi.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(200).json({ message: 'CORS test successful from backend!' });
});

const corsOptions = {
  origin: 'https://matsuishi.github.io', 
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); 

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const conversionCache = {}; 

app.post('/convert', upload.array('images'), async (req, res) => { 
    console.log('--- POST /convert route hit ---'); 
    console.log('Request files:', req.files); 
    console.log('Request body:', req.body); 

    try { 
        const backendBaseUrl = process.env.K_SERVICE_URL || process.env.CLOUD_RUN_URL || `http://localhost:${port}`; 
        // ... (画像変換ロジック) ...
        
        res.json({  
            conversionId,  
            images: convertedFiles.map(f => ({ name: f.name, size: f.size, data: f.url })) 
        }); 

    } catch (error) { 
        console.error('Image conversion error:', error); 
        res.status(500).send('Image conversion failed.'); 
    } 
}); 

app.get('/download-zip/:conversionId', (req, res) => { 
    const { conversionId } = req.params; 
    // ... (ダウンロードロジック) ...
}); 

// 404 ハンドラ
app.use((req, res, next) => {
  res.status(404).send('Backend API: Not Found');
});

// ★★★ NEW DEBUGGING CODE START ★★★
console.log(`--- Attempting to listen on port ${port} (from process.env.PORT or 3001) ---`);
app.listen(port, '0.0.0.0', () => { // 明示的に 0.0.0.0 にバインド
    console.log(`--- Server listening successfully at http://0.0.0.0:${port} ---`);
});
// ★★★ NEW DEBUGGING CODE END ★★★
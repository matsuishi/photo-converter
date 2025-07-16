// TOP OF FILE
console.log('--- server.js script started execution (TOP OF FILE) ---'); 

const express = require('express');
const multer = require('multer');
// const sharp = require('sharp'); // sharp は try/catch でロードするためコメントアウト
const cors = require('cors'); 
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
// const heicConvert = require('heic-convert'); // heicConvert も try/catch でロードするためコメントアウト

let sharp; // sharp を let で宣言
let heicConvert; // heicConvert も let で宣言

// ★★★ NEW DEBUGGING CODE START (sharp/heic-convert ロードテスト) ★★★
try {
  console.log('--- Attempting to load sharp and heic-convert ---');
  sharp = require('sharp'); // ロードをtry/catchで囲む
  heicConvert = require('heic-convert'); // ロードをtry/catchで囲む
  console.log('--- sharp and heic-convert loaded successfully ---');
} catch (e) {
  console.error('--- ERROR: Failed to load sharp or heic-convert on startup ---', e.message, e.stack);
  // 致命的なエラーなので、ここでプロセスを終了させ、Cloud Run にエラーを通知
  process.exit(1); 
}
// ★★★ NEW DEBUGGING CODE END ★★★


const app = express();
const port = process.env.PORT || 3001; 
const uploadDir = './uploads'; 

if (!fs.existsSync(uploadDir)) { 
    fs.mkdirSync(uploadDir); 
} 

// デバッグ用GETルート - このまま維持
app.get('/test-cors', (req, res) => {
  console.log('--- /test-cors route hit ---'); 
  console.log('Request Origin:', req.headers.origin); 
  
  res.setHeader('Access-Control-Allow-Origin', 'https://matsuishi.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  res.status(200).json({ message: 'CORS test successful from backend!' });
});

// CORSオプションを定義
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
    // 強制的にCORSヘッダーを設定（app.use(cors)が機能しない場合の最終手段）
    res.setHeader('Access-Control-Allow-Origin', 'https://matsuishi.github.io'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST', 'DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('--- POST /convert route hit ---'); 
    console.log('Request files:', req.files); 
    console.log('Request body:', req.body); 

    try { 
        const { width, height, quality, format } = req.body; 
        const conversionId = Date.now().toString(); 
        const convertedFiles = []; 

        const backendBaseUrl = process.env.K_SERVICE_URL || process.env.CLOUD_RUN_URL || `http://localhost:${port}`; 

        const processFile = async (file) => { 
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8'); 
            const outputFilename = `${path.parse(originalName).name}.${format}`; 
            const outputPath = path.join(uploadDir, outputFilename); 

            let imageBuffer = file.buffer; 

            if (file.mimetype === 'image/heic') { 
                imageBuffer = await heicConvert({ buffer: file.buffer, format: 'JPEG', quality: 1 }); 
            } 

            let sharpInstance = sharp(imageBuffer) 
                .resize(width ? parseInt(width) : null, height ? parseInt(height) : null); 

            let outputBuffer; 
            if (format === 'webp') { 
                outputBuffer = await sharpInstance.webp({ quality: quality ? parseInt(quality) : 80 }).toBuffer(); 
            } else { 
                outputBuffer = await sharpInstance.jpeg({ quality: quality ? parseInt(quality) : 80 }).toBuffer(); 
            } 

            fs.writeFileSync(outputPath, outputBuffer); 

            convertedFiles.push({ 
                name: outputFilename, 
                path: outputPath, 
                size: outputBuffer.length, 
                url: `${backendBaseUrl}/downloads/${outputFilename}` 
            }); 
        }; 

        await Promise.all(req.files.map(processFile)); 

        conversionCache[conversionId] = convertedFiles.map(f => f.path); 

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
    const filepaths = conversionCache[conversionId]; 

    if (!filepaths) { 
        return res.status(404).send('Conversion not found or expired.'); 
    } 

    const archive = archiver('zip', { zlib: { level: 9 } }); 
    archive.on('error', (err) => res.status(500).send({error: err.message})); 
    res.attachment('converted_images.zip').type('zip'); 
    archive.pipe(res); 

    filepaths.forEach(filepath => { 
        archive.file(filepath, { name: path.basename(filepath) }); 
    }); 

    archive.finalize(); 
}); 

// どのルートにもマッチしない場合、404エラーを返すミドルウェア
app.use((req, res, next) => {
  res.status(404).send('Backend API: Not Found');
});

// app.listen の周辺のログも維持
console.log(`--- Attempting to listen on port ${port} (Cloud Run PORT env: ${process.env.PORT}) ---`);
app.listen(port, '0.0.0.0', () => { 
    console.log(`--- Server listening successfully at http://0.0.0.0:${port} ---`);
}).on('error', (err) => { 
    console.error('--- app.listen ERROR: Server failed to start ---', err.message, err.stack); 
    process.exit(1); 
});
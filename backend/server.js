const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const heicConvert = require('heic-convert');

const app = express();
// ★修正点1: Cloud Run の PORT 環境変数を使用
const port = process.env.PORT || 3001;
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ★修正点2: より明示的なCORS設定
const corsOptions = {
  origin: 'https://matsuishi.github.io', // ★あなたのGitHub Pagesのドメインを正確に指定
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // app.use(cors()); の代わりにこれを使用

app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const conversionCache = {};

app.post('/convert', upload.array('images'), async (req, res) => {
    try {
        const { width, height, quality, format } = req.body;
        const conversionId = Date.now().toString();
        const convertedFiles = [];

        // ★修正点3a: バックエンド自身の公開URLを取得するための環境変数を追加
        // Cloud Run の URL は CLOUD_RUN_URL 環境変数で提供されます (後でGCPで設定)
        const backendBaseUrl = process.env.CLOUD_RUN_URL || `http://localhost:${port}`; 

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
                // ★修正点3b: ダウンロードURLにバックエンドの公開URLを使用
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
        console.error(error);
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

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
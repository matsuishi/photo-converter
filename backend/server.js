const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const heicConvert = require('heic-convert');

const app = express();
const port = 3001;
const uploadDir = './uploads';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(cors());
app.use('/downloads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const conversionCache = {};

app.post('/convert', upload.array('images'), async (req, res) => {
    try {
        const { width, height, quality, format } = req.body;
        const conversionId = Date.now().toString();
        const convertedFiles = [];

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
                url: `http://localhost:${port}/downloads/${outputFilename}`
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
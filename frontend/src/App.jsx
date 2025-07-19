import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './App.css';

// Define the base URL for the API based on the environment
const apiBaseUrl = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://photo-converter-350490003884.asia-northeast1.run.app';

function App() {
  const [files, setFiles] = useState([]);
  const [convertedImages, setConvertedImages] = useState([]);
  const [conversionId, setConversionId] = useState(null);
  const [width, setWidth] = useState('1200');
  const [height, setHeight] = useState('');
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('webp'); // webp or jpg
  const [aspectRatio, setAspectRatio] = useState(undefined); // New state for aspect ratio
  const imgRefs = useRef(new Map()); // Change to Map

  const onDrop = useCallback(acceptedFiles => {
    const imageFiles = acceptedFiles.filter(file => 
        file.type === 'image/jpeg' || file.type === 'image/png'
    );

    if (imageFiles.length !== acceptedFiles.length) {
      alert('JPGまたはPNG形式の画像ファイルのみ選択できます。一部のファイルは無視されました。');
    }

    const newFiles = imageFiles.map(file => ({
        originalFile: file, // Store the original File object
        id: URL.createObjectURL(file), // Use object URL as a unique ID for React keys and imgRefs
        preview: URL.createObjectURL(file),
        name: file.name, // Add name property
        crop: undefined, // Initial crop state for each file
    }));
    setFiles(prevFiles => [...newFiles, ...prevFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      // acceptプロパティを完全に削除し、OSのデフォルトのファイルピッカーを使用させる
  });

  const removeFile = (fileToRemove) => {
      setFiles(prevFiles => prevFiles.filter(file => {
          if (file === fileToRemove) {
              imgRefs.current.delete(file.id); // Remove ref when file is removed
              URL.revokeObjectURL(file.preview); // Clean up object URL
              return false;
          }
          return true;
      }));
  }

  const handleCropChange = (crop, percentCrop, index) => {
    setFiles(prevFiles => {
        return prevFiles.map((f, i) => {
            if (i === index) {
                return { ...f, crop: crop };
            }
            return f;
        });
    });
  };


  const handleConvert = async () => {
    console.log('--- Starting conversion process ---');
    console.log('Files to convert (before processing):', files);

    const formData = new FormData();
    const crops = [];
    files.forEach((file) => {
      formData.append('images', file.originalFile); // Use the original File object
      const img = imgRefs.current.get(file.id); // Get image ref from Map
      console.log(`Processing file: ${file.name}, ID: ${file.id}`);
      console.log('Image element ref (img):', img);
      if (img) {
          console.log(`Image natural dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
          console.log(`Image displayed dimensions: ${img.width}x${img.height}`);
      } else {
          console.warn(`WARNING: Image element ref not found for file ID: ${file.id}`);
      }
      let cropData = null;
      if (file.crop && img && img.naturalWidth && img.naturalHeight) {
          const scaleX = img.naturalWidth / img.width;
          const scaleY = img.naturalHeight / img.height;
          cropData = {
              x: Math.round(file.crop.x * scaleX),
              y: Math.round(file.crop.y * scaleY),
              width: Math.round(file.crop.width * scaleX),
              height: Math.round(file.crop.height * scaleY)
          };
          console.log('Calculated cropData:', cropData);
      } else if (file.crop) {
          console.warn('WARNING: Crop data exists but image dimensions are not available for scaling.', file.crop);
      }
      crops.push(cropData);
    });

    formData.append('crops', JSON.stringify(crops));
    formData.append('width', width);
    formData.append('height', height);
    formData.append('quality', quality);
    formData.append('format', format);

    console.log('FormData crops sent:', JSON.stringify(crops));

    try {
      const response = await axios.post(`${apiBaseUrl}/convert`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Backend response:', response.data);
      setConvertedImages(prev => [...response.data.images, ...prev]);
      setConversionId(response.data.conversionId);
      setFiles(prevFiles => prevFiles.map(f => ({ ...f, crop: undefined })));
      console.log('Files state after crop reset:', files.map(f => ({ id: f.id, crop: f.crop })));
    } catch (error) {
      console.error('Error converting images:', error);
      if (error.response) {
          console.error('Error response data:', error.response.data);
          console.error('Error response status:', error.response.status);
          console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
          console.error('Error request:', error.request);
      } else {
          console.error('Error message:', error.message);
      }
    }
  };

  const removeConvertedImage = (indexToRemove) => {
    setConvertedImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
  };

  const handleIndividualDownload = async (imageUrl, fileName) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading individual image:', error);
      alert('画像のダウンロードに失敗しました。');
    }
  };

  const handleReset = () => {
    // Revoke all object URLs to prevent memory leaks
    files.forEach(file => URL.revokeObjectURL(file.preview));

    setFiles([]);
    setConvertedImages([]);
    setConversionId(null);
    setWidth('1200');
    setHeight('');
    setQuality(80);
    setFormat('webp');
    imgRefs.current.clear(); // Clear the Map of image refs
  };

  return (
    <div className="App">
        <div className="main-content">
            <div className="controls-container">
                <h1>画像形式変換ツール</h1>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? '' : ''}`}>
                    <input {...getInputProps()} />
                    <p>ここにファイルをドラッグ＆ドロップするか、<br/>クリックしてファイルを選択</p>
                </div>
                <div className="controls">
                    <div className="format-select">
                        <label>変換形式:</label>
                        <select value={format} onChange={e => setFormat(e.target.value)}>
                            <option value="webp">WebP</option>
                            <option value="jpg">JPG</option>
                        </select>
                    </div>
                    <input type="number" placeholder="幅 (任意)" value={width} onChange={e => setWidth(e.target.value)} />
                    <input type="number" placeholder="高さ (任意)" value={height} onChange={e => setHeight(e.target.value)} />
                    <div className="aspect-ratio-select">
                        <label>アスペクト比:</label>
                        <select value={aspectRatio === undefined ? 'none' : aspectRatio} onChange={e => setAspectRatio(e.target.value === 'none' ? undefined : parseFloat(e.target.value))}>
                            <option value="none">固定しない</option>
                            <option value={16 / 9}>16:9</option>
                            <option value={3 / 2}>3:2</option>
                            <option value={4 / 3}>4:3</option>
                        </select>
                    </div>
                    <div className="quality-slider">
                        <label>品質: {quality}</label>
                        <input type="range" min="1" max="100" value={quality} onChange={e => setQuality(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleConvert} disabled={files.length === 0}>変換実行</button>
                
                <button onClick={handleReset}>リセット</button>
            </div>

            <div className="converted-container">
                <div className="original-images-container">
                  <h2>変換待ちの画像 ({files.length})</h2>
                  <div className="original-images">
                    {files.map((file) => (
                      <div key={file.id} className="preview-item-large">
                        <ReactCrop
                            crop={file.crop}
                            onChange={(c, pc) => handleCropChange(c, pc, files.indexOf(file))}
                            aspect={aspectRatio}
                        >
                            <img 
                                ref={el => {
                                    if (el) imgRefs.current.set(el.id, el);
                                    else imgRefs.current.delete(el.id);
                                }} 
                                src={file.preview} 
                                alt={file.name} 
                            />
                        </ReactCrop>
                        <p>{file.name}</p>
                        <button className="remove-btn" onClick={() => removeFile(file)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <h2>変換後の画像 ({convertedImages.length})</h2>
                <div className="converted-images">
                    {convertedImages.map((image, index) => (
                        <div key={image.data} className="preview-item-large">
                            <img src={`${image.data}?t=${new Date().getTime()}`} alt={image.name} />
                            <p>{image.name} ({(image.size / 1024).toFixed(2)} KB)</p>
                            <button onClick={() => handleIndividualDownload(image.data, image.name)} className="download-btn">ダウンロード</button>
                            <button className="remove-btn" onClick={() => removeConvertedImage(index)}>×</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

export default App;
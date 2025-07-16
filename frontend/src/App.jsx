import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [convertedImages, setConvertedImages] = useState([]);
  const [conversionId, setConversionId] = useState(null);
  const [width, setWidth] = useState('1200');
  const [height, setHeight] = useState('');
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('webp'); // webp or jpg

  const onDrop = useCallback(acceptedFiles => {
    setFiles(prevFiles => [...acceptedFiles, ...prevFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
      onDrop, 
      accept: {
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
          'image/heic': ['.heic'],
      }
  });

  const removeFile = (fileToRemove) => {
      setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  }

  const handleConvert = async () => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('width', width);
    formData.append('height', height);
    formData.append('quality', quality);
    formData.append('format', format);

    try {
      const response = await axios.post('https://photo-converter-350490003884.asia-northeast1.run.app/convert', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setConvertedImages(prev => [...response.data.images, ...prev]);
      setConversionId(response.data.conversionId);
    } catch (error) {
      console.error('Error converting images:', error);
    }
  };

  const handleDownloadZip = () => {
    if (!conversionId) return;
    const downloadUrl = `https://photo-converter-350490003884.asia-northeast1.run.app/download-zip/${conversionId}`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="App">
        <div className="main-content">
            <div className="controls-container">
                <h1>画像形式変換ツール</h1>
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
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
                    <div className="quality-slider">
                        <label>品質: {quality}</label>
                        <input type="range" min="1" max="100" value={quality} onChange={e => setQuality(e.target.value)} />
                    </div>
                </div>
                <button onClick={handleConvert} disabled={files.length === 0}>変換実行</button>
                <button onClick={handleDownloadZip} disabled={conversionId === null}>ZIPでダウンロード</button>
                {/*
                <div className="original-images-container">
                    <h2>変換待ちの画像 ({files.length})</h2>
                    <div className="original-images">
                        {files.map((file, index) => (
                            <div key={index} className="preview-item-small">
                                <img src={URL.createObjectURL(file)} alt={file.name} />
                                <p>{file.name}</p>
                                <button className="remove-btn" onClick={() => removeFile(file)}>×</button>
                            </div>
                        ))}
                    </div>
                </div>*/}
                
            </div>

            <div className="converted-container">
              
                {/* ★ここから：変換待ち一覧を流れの先頭へ移動 */}
                <div className="original-images-container">
                  <h2>変換待ちの画像 ({files.length})</h2>
                  <div className="original-images">
                    {files.map((file, index) => (
                      <div key={index} className="preview-item-small">
                        <img src={URL.createObjectURL(file)} alt={file.name} />
                        <p>{file.name}</p>
                        <button className="remove-btn" onClick={() => removeFile(file)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* ★ここまで */}
                <h2>変換後の画像 ({convertedImages.length})</h2>
                <div className="converted-images">
                    {convertedImages.map((image, index) => (
                        <div key={index} className="preview-item-large">
                            <img src={image.data} alt={image.name} />
                            <p>{image.name} ({(image.size / 1024).toFixed(2)} KB)</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

export default App;
import React, { useState, useRef } from 'react';
import { Upload, File, X, Image, Video, FileText, AlertCircle, Check, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import axios from 'axios';

interface FileUploadProps {
  onFileUpload: (fileUrl: string, metadata?: any) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  multiple?: boolean;
  allowExternalUrl?: boolean;
  placeholder?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept = "image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar",
  maxSize = 50,
  className,
  multiple = false,
  allowExternalUrl = true,
  placeholder = "Upload a file or enter a URL"
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [externalUrl, setExternalUrl] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fixed API URL handling based on your .env configuration
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  // Server base URL for file access (without /api/v1)
  const SERVER_BASE_URL = API_BASE_URL.replace('/api/v1', '') || 'http://localhost:5000';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      if (!multiple) {
        handleFileUpload(files[0]);
      } else {
        files.forEach(file => handleFileUpload(file));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (!multiple) {
        handleFileUpload(files[0]);
      } else {
        files.forEach(file => handleFileUpload(file));
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    setError(null);
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    const allowedTypes = accept.split(',').map(type => type.trim());
    const isValidType = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type);
      } else if (type.includes('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      } else {
        return file.type === type;
      }
    });

    if (!isValidType) {
      setError('File type not supported');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get auth token from localStorage or auth store
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          token = state?.token || '';
        } catch (error) {
          console.error('Error parsing auth storage:', error);
        }
      }

      // Use API_BASE_URL which includes /api/v1 for the upload endpoint
      const response = await axios.post(`${API_BASE_URL}/courses/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      console.log('Upload response:', response.data);

      const uploadedFile = {
        ...response.data.data,
        file,
        type: 'upload'
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      
      // FIXED: Use SERVER_BASE_URL (without /api/v1) for file access
      // This ensures cover images work properly
      const absoluteFileUrl = uploadedFile.fileUrl.startsWith('http') 
        ? uploadedFile.fileUrl 
        : `${SERVER_BASE_URL}${uploadedFile.fileUrl}`;
      
      console.log('File URL returned:', absoluteFileUrl);
      onFileUpload(absoluteFileUrl, uploadedFile);
      
      setUploading(false);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleExternalUrl = () => {
    if (!externalUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(externalUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    // Process different URL types
    let processedUrl = externalUrl.trim();
    
    // Handle Google Drive URLs
    if (processedUrl.includes('drive.google.com')) {
      if (processedUrl.includes('/file/d/')) {
        const fileId = processedUrl.split('/file/d/')[1]?.split('/')[0];
        if (fileId) {
          processedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        }
      }
    }
    
    // Handle YouTube URLs
    if (processedUrl.includes('youtube.com/watch') || processedUrl.includes('youtu.be/')) {
      let videoId = '';
      if (processedUrl.includes('youtube.com/watch')) {
        videoId = processedUrl.split('v=')[1]?.split('&')[0];
      } else if (processedUrl.includes('youtu.be/')) {
        videoId = processedUrl.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        processedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    }

    const externalFile = {
      originalName: 'External File',
      fileUrl: processedUrl,
      fileSize: 0,
      mimeType: 'external/url',
      type: 'external'
    };

    setUploadedFiles(prev => [...prev, externalFile]);
    console.log('Calling onFileUpload with external URL:', processedUrl);
    onFileUpload(processedUrl, externalFile);
    setExternalUrl('');
    setUrlMode(false);
    setError(null);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-6 w-6" />;
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6" />;
    if (mimeType === 'external/url') return <ExternalLink className="h-6 w-6" />;
    return <FileText className="h-6 w-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'External URL';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearError = () => setError(null);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toggle Mode Buttons */}
      {allowExternalUrl && (
        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setUrlMode(false);
              setError(null);
            }}
            className={cn(
              "px-3 py-1 text-sm rounded-md border",
              !urlMode 
                ? "bg-primary-100 text-primary-700 border-primary-300" 
                : "bg-gray-100 text-gray-700 border-gray-300"
            )}
          >
            <Upload className="h-4 w-4 mr-1 inline" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => {
              setUrlMode(true);
              setError(null);
            }}
            className={cn(
              "px-3 py-1 text-sm rounded-md border",
              urlMode 
                ? "bg-primary-100 text-primary-700 border-primary-300" 
                : "bg-gray-100 text-gray-700 border-gray-300"
            )}
          >
            <Link2 className="h-4 w-4 mr-1 inline" />
            Add URL
          </button>
        </div>
      )}

      {/* URL Input Mode */}
      {urlMode && allowExternalUrl ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center mb-4">
            <ExternalLink className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-700">Add External URL</h4>
            <p className="text-xs text-gray-500">Google Drive, YouTube, Dropbox, or any public URL</p>
          </div>
          
          <div className="flex space-x-2">
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://example.com/file.pdf"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              onKeyPress={(e) => e.key === 'Enter' && handleExternalUrl()}
            />
            <button
              type="button"
              onClick={handleExternalUrl}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={!externalUrl.trim()}
            >
              Add
            </button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            <p><strong>Supported URLs:</strong></p>
            <ul className="list-disc list-inside">
              <li>Google Drive: https://drive.google.com/file/d/...</li>
              <li>YouTube: https://www.youtube.com/watch?v=...</li>
              <li>Dropbox: https://dropbox.com/s/...</li>
              <li>Direct file links</li>
            </ul>
          </div>
        </div>
      ) : (
        /* File Upload Mode */
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            isDragging 
              ? "border-primary-500 bg-primary-50" 
              : "border-gray-300 hover:border-gray-400",
            uploading && "pointer-events-none opacity-50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-2">
            <Upload className={cn(
              "h-10 w-10",
              isDragging ? "text-primary-500" : "text-gray-400"
            )} />
            
            {uploading ? (
              <>
                <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  Max file size: {maxSize}MB • Supported file types
                </p>
                <p className="text-xs text-gray-400">
                  {placeholder}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start space-x-2 text-error-600 text-sm bg-error-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span>{error}</span>
            <button 
              onClick={clearError}
              className="ml-2 text-error-500 hover:text-error-700 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Check className="h-4 w-4 mr-1 text-success-600" />
            {uploadedFiles.length === 1 ? 'Added File' : `Added Files (${uploadedFiles.length})`}
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 text-gray-500">
                    {getFileIcon(file.mimeType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName || 'External File'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.fileSize)}</span>
                      {file.type === 'external' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          External URL
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {file.fileUrl && (
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                      title="Preview file"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => removeUploadedFile(index)}
                    className="text-gray-400 hover:text-error-600"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Type Guide */}
      {!uploading && !urlMode && (
        <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
          <p className="font-medium mb-1">Supported file types:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            <span>📄 Documents: PDF, DOC, DOCX, PPT, PPTX</span>
            <span>🖼️ Images: JPG, PNG, GIF, SVG</span>
            <span>🎥 Videos: MP4, AVI, MOV, WebM</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
import React, { useState, useEffect } from 'react';
import { 
  Download, ExternalLink, ZoomIn, ZoomOut, RotateCw, 
  FileText, AlertCircle, Loader2, RefreshCw, Eye, Shield
} from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  showControls?: boolean;
  allowDownload?: boolean;
  height?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  fileName = 'Document',
  className = '',
  showControls = true,
  allowDownload = true,
  height = '600px'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'embed' | 'viewer' | 'mozilla' | 'object' | 'blocked'>('embed');
  const [browserInfo, setBrowserInfo] = useState<{isEdge: boolean, isChrome: boolean, isSafari: boolean}>({
    isEdge: false,
    isChrome: false,
    isSafari: false
  });

  // Detect browser
  useEffect(() => {
    const userAgent = navigator.userAgent;
    setBrowserInfo({
      isEdge: /Edg/i.test(userAgent),
      isChrome: /Chrome/i.test(userAgent) && !/Edg/i.test(userAgent),
      isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)
    });
  }, []);

  // Detect if the file is a PDF
  const isPDF = fileUrl.toLowerCase().includes('.pdf') || 
               fileUrl.includes('application/pdf') ||
               fileName.toLowerCase().endsWith('.pdf');

  // Google Drive file ID extraction
  const getGoogleDriveFileId = (url: string) => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Create Edge-compatible viewing URLs
  const getViewingUrls = (url: string) => {
    const fileId = getGoogleDriveFileId(url);
    
    if (fileId) {
      return {
        // Google Drive direct download (works in Edge)
        direct: `https://drive.google.com/uc?export=download&id=${fileId}`,
        // Embed with different parameters
        embed: `https://drive.google.com/file/d/${fileId}/preview?embedded=true&chrome=false`,
        // Google Docs Viewer (more Edge-friendly)
        viewer: `https://docs.google.com/viewer?url=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}&embedded=true&chrome=false`,
        // Mozilla PDF.js (works well in Edge)
        mozilla: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(`https://drive.google.com/uc?export=download&id=${fileId}`)}`,
        // Original URL
        original: url,
        download: `https://drive.google.com/uc?export=download&id=${fileId}`
      };
    }
    
    return {
      direct: url,
      embed: url,
      viewer: `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true&chrome=false`,
      mozilla: `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(url)}`,
      original: url,
      download: url
    };
  };

  const urls = getViewingUrls(fileUrl);

  // Auto-select best view mode for Edge
  useEffect(() => {
    if (browserInfo.isEdge) {
      // For Edge, start with Mozilla PDF.js as it's most compatible
      setViewMode('mozilla');
    } else if (browserInfo.isChrome) {
      setViewMode('embed');
    } else {
      setViewMode('viewer');
    }
  }, [browserInfo]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('PDF viewing blocked by browser security. Click "Open in New Tab" to view the document.');
    setViewMode('blocked');
  };

  // Download handler
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = urls.download;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open in new tab
  const handleOpenExternal = () => {
    window.open(urls.original, '_blank', 'noopener,noreferrer');
  };

  // Switch view modes
  const switchViewMode = (mode: 'embed' | 'viewer' | 'mozilla' | 'object' | 'blocked') => {
    setViewMode(mode);
    setIsLoading(true);
    setError(null);
  };

  // Get current viewing URL
  const getCurrentUrl = () => {
    switch (viewMode) {
      case 'viewer': return urls.viewer;
      case 'mozilla': return urls.mozilla;
      case 'object': return urls.direct;
      case 'embed': return urls.embed;
      default: return urls.embed;
    }
  };

  // Edge-specific PDF display using object tag
  const EdgePDFObject = () => (
    <object
      data={urls.direct}
      type="application/pdf"
      className="w-full h-full"
      onLoad={handleIframeLoad}
      onError={handleIframeError}
    >
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Plugin Required</h3>
          <p className="text-gray-600 mb-4">Your browser needs a PDF plugin to display this document.</p>
          <Button
            variant="primary"
            onClick={handleOpenExternal}
            icon={<ExternalLink className="h-4 w-4" />}
          >
            Open in New Tab
          </Button>
        </div>
      </div>
    </object>
  );

  if (!isPDF) {
    // Handle non-PDF files
    return (
      <div className={cn("border border-gray-200 rounded-lg overflow-hidden", className)}>
        {showControls && (
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                {allowDownload && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenExternal}
                  icon={<ExternalLink className="h-4 w-4" />}
                >
                  Open
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative" style={{ height }}>
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={fileName}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </div>
    );
  }

  // Enhanced PDF viewer with Edge compatibility
  return (
    <div className={cn("border border-gray-200 rounded-lg overflow-hidden", className)}>
      {showControls && (
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-700">{fileName}</span>
              <span className="text-xs text-gray-500 bg-red-100 text-red-700 px-2 py-1 rounded">PDF</span>
              {browserInfo.isEdge && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Edge Compatible
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Selector - Edge optimized */}
              <div className="hidden sm:flex rounded-md border border-gray-300 overflow-hidden">
                {browserInfo.isEdge ? (
                  <>
                    <button
                      onClick={() => switchViewMode('mozilla')}
                      className={cn(
                        "px-2 py-1 text-xs",
                        viewMode === 'mozilla' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                      title="Mozilla PDF.js (Recommended for Edge)"
                    >
                      PDF.js
                    </button>
                    <button
                      onClick={() => switchViewMode('viewer')}
                      className={cn(
                        "px-2 py-1 text-xs border-l border-gray-300",
                        viewMode === 'viewer' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                      title="Google Docs viewer"
                    >
                      Viewer
                    </button>
                    <button
                      onClick={() => switchViewMode('object')}
                      className={cn(
                        "px-2 py-1 text-xs border-l border-gray-300",
                        viewMode === 'object' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                      title="Native browser PDF viewer"
                    >
                      Native
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => switchViewMode('embed')}
                      className={cn(
                        "px-2 py-1 text-xs",
                        viewMode === 'embed' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      Embed
                    </button>
                    <button
                      onClick={() => switchViewMode('viewer')}
                      className={cn(
                        "px-2 py-1 text-xs border-l border-gray-300",
                        viewMode === 'viewer' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      Viewer
                    </button>
                    <button
                      onClick={() => switchViewMode('mozilla')}
                      className={cn(
                        "px-2 py-1 text-xs border-l border-gray-300",
                        viewMode === 'mozilla' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      PDF.js
                    </button>
                  </>
                )}
              </div>

              {/* Actions */}
              {allowDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  icon={<Download className="h-4 w-4" />}
                  title="Download PDF"
                />
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenExternal}
                icon={<ExternalLink className="h-4 w-4" />}
                title="Open in new tab"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="relative" style={{ height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading PDF...</p>
              {browserInfo.isEdge && (
                <p className="text-xs text-blue-600 mt-1">
                  Using Edge-compatible viewer
                </p>
              )}
            </div>
          </div>
        )}
        
        {error || viewMode === 'blocked' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md px-4">
              <Shield className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {browserInfo.isEdge ? 'Microsoft Edge Security Block' : 'Browser Security Block'}
              </h3>
              <p className="text-gray-600 mb-4">
                {browserInfo.isEdge 
                  ? 'Microsoft Edge has blocked this PDF from displaying in an embedded frame for security reasons.'
                  : 'Your browser has blocked this PDF from displaying for security reasons.'
                }
              </p>
              
              <div className="space-y-3">
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                  <p className="font-medium mb-2">💡 Solutions:</p>
                  <ul className="text-left space-y-1">
                    <li>• Click "Open in New Tab" below (Recommended)</li>
                    <li>• Try the "PDF.js" viewer mode</li>
                    <li>• Download the PDF to view locally</li>
                    {browserInfo.isEdge && (
                      <li>• Switch to Chrome or Firefox for better PDF viewing</li>
                    )}
                  </ul>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="primary"
                    onClick={handleOpenExternal}
                    icon={<ExternalLink className="h-4 w-4" />}
                  >
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchViewMode('mozilla')}
                    disabled={viewMode === 'mozilla'}
                  >
                    Try PDF.js
                  </Button>
                </div>
                
                {allowDownload && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleDownload}
                    icon={<Download className="h-4 w-4" />}
                  >
                    Download PDF
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {viewMode === 'object' ? (
              <EdgePDFObject />
            ) : (
              <iframe
                src={getCurrentUrl()}
                className="w-full h-full border-0"
                title={fileName}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                allow="fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        )}
      </div>
      
      {/* Footer with browser-specific tips */}
      {showControls && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              💡 Current: <strong className="text-gray-700">{viewMode}</strong>
              {browserInfo.isEdge && " (Edge optimized)"}
            </span>
            <span className="hidden sm:inline">
              {browserInfo.isEdge 
                ? "Edge users: Try 'Open in New Tab' for best results"
                : "Use Ctrl+Scroll to zoom"
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
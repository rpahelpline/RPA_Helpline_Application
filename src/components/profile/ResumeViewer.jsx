import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Download, X, Loader2 } from 'lucide-react';

export const ResumeViewer = ({ isOpen, onClose, resumeUrl, fileName = 'resume.pdf' }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleDownload = () => {
    if (!resumeUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = resumeUrl;
      link.download = fileName || 'resume.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  if (!resumeUrl) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl" showCloseButton={true}>
      <div className="flex flex-col h-[90vh] relative">
        {/* Minimal header with download button */}
        <div className="absolute top-2 right-2 z-20">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2 bg-background/90 backdrop-blur-sm border"
              title="Download Resume"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* PDF Viewer - Full Screen */}
        <div className="flex-1 relative w-full h-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Loading resume...</p>
              </div>
            </div>
          )}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Failed to load resume</p>
                <Button variant="outline" size="sm" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              src={`${resumeUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
              className="w-full h-full border-0"
              title="Resume Viewer"
              onLoad={() => {
                setLoading(false);
                setError(false);
              }}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};


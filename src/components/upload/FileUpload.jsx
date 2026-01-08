import { memo, useState, useCallback, useRef } from 'react';
import { uploadApi } from '../../services/api';
import { Button } from '../ui/Button';
import { useToast } from '../../hooks/useToast';
import { Upload, X, FileText, Image, Loader2, CheckCircle } from 'lucide-react';

export const FileUpload = memo(({
  type = 'image', // 'image' | 'resume' | 'document'
  bucket = 'uploads', // Supabase bucket name
  useSupabase = true,
  onUploadComplete,
  onUploadError,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept,
  className = '',
  children
}) => {
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Get accept types based on file type
  const getAcceptTypes = () => {
    if (accept) return accept;
    switch (type) {
      case 'image':
        return 'image/jpeg,image/png,image/gif,image/webp';
      case 'resume':
      case 'document':
        return 'application/pdf,.doc,.docx';
      default:
        return '*/*';
    }
  };

  const handleUpload = useCallback(async (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      toast.error(`File is too large. Maximum size is ${maxMB}MB.`);
      onUploadError?.({ error: 'File too large' });
      return;
    }

    setUploading(true);
    try {
      let response;
      if (useSupabase) {
        response = await uploadApi.uploadToSupabase(bucket, file);
      } else {
        response = await uploadApi.uploadFile(type, file);
      }

      setUploadedFile({
        name: file.name,
        url: response.file.url,
        ...response.file
      });

      toast.success('File uploaded successfully!');
      onUploadComplete?.(response.file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.error || 'Failed to upload file');
      onUploadError?.(error);
    } finally {
      setUploading(false);
    }
  }, [type, bucket, useSupabase, maxSize, onUploadComplete, onUploadError, toast]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleUpload(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const FileIcon = type === 'image' ? Image : FileText;

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptTypes()}
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Custom children (slot) */}
      {children ? (
        <div onClick={openFilePicker} className="cursor-pointer">
          {children}
        </div>
      ) : uploadedFile ? (
        /* Uploaded file display */
        <div className="tech-panel p-4 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono text-foreground truncate">{uploadedFile.name}</p>
            <a
              href={uploadedFile.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View file
            </a>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={openFilePicker}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-card/50'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground font-mono">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileIcon className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-foreground font-mono">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {type === 'image' ? 'PNG, JPG, GIF, WebP' : 'PDF, DOC, DOCX'}
                {' '} up to {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

// Avatar upload component
export const AvatarUpload = memo(({ currentAvatar, onUploadComplete, className = '' }) => {
  const [preview, setPreview] = useState(currentAvatar);

  const handleComplete = (file) => {
    setPreview(file.url);
    onUploadComplete?.(file);
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
          {preview ? (
            <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            'U'
          )}
        </div>
        <FileUpload
          type="image"
          bucket="avatars"
          onUploadComplete={handleComplete}
          className="absolute bottom-0 right-0"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="w-4 h-4 text-white" />
          </div>
        </FileUpload>
      </div>
    </div>
  );
});

AvatarUpload.displayName = 'AvatarUpload';






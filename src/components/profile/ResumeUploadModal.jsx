import { useState, useRef, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { profileApi, uploadApi } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Upload, FileText, CheckCircle, Loader2, X } from 'lucide-react';

export const ResumeUploadModal = ({ isOpen, onClose, profile, onSave }) => {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [currentResume, setCurrentResume] = useState(profile?.resume_url || null);
  const fileInputRef = useRef(null);

  // Update currentResume when profile changes
  useEffect(() => {
    if (profile?.resume_url !== undefined) {
      setCurrentResume(profile.resume_url || null);
    }
  }, [profile?.resume_url]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      let resumeUrl;
      try {
        const response = await uploadApi.uploadToSupabase('resumes', file);
        resumeUrl = response?.file?.url ?? response?.url;
      } catch (uploadErr) {
        console.warn('Supabase resume upload failed, trying local upload:', uploadErr);
        const local = await uploadApi.uploadFile('resume', file);
        const path = local?.file?.url ?? local?.url ?? '';
        const origin = (typeof window !== 'undefined' && window.location?.origin) || '';
        resumeUrl = path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
      }

      if (!resumeUrl) {
        throw new Error('No resume URL returned from upload');
      }

      await profileApi.updateProfile({ resume_url: resumeUrl });
      setCurrentResume(resumeUrl);
      toast.success('Resume uploaded successfully');
      onSave?.();
    } catch (error) {
      console.error('Failed to upload resume:', error);
      toast.error(error?.error || error?.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!window.confirm('Are you sure you want to remove your resume?')) {
      return;
    }

    try {
      await profileApi.updateProfile({ resume_url: null });
      setCurrentResume(null);
      toast.success('Resume removed successfully');
      onSave?.();
    } catch (error) {
      console.error('Failed to remove resume:', error);
      toast.error(error?.error || error?.message || 'Failed to remove resume');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Resume" size="md">
      <div className="space-y-4">
        {currentResume ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Resume uploaded</p>
                <a
                  href={currentResume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  View current resume
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveResume}
                className="text-red-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Replace Resume</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Resume
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">No resume uploaded</p>
            <p className="text-xs text-muted-foreground mb-4">PDF or Word document (max 5MB)</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};


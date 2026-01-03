import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const uploadType = req.params.type || 'image';
  const allowed = allowedTypes[uploadType] || allowedTypes.image;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowed.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB default
  }
});

// Upload single file
router.post('/:type', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { type } = req.params;
  const fileUrl = `/uploads/${req.file.filename}`;

  // If uploading avatar, update user profile
  if (type === 'avatar') {
    await supabaseAdmin
      .from('profiles')
      .update({ 
        avatar_url: fileUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);
  }

  res.json({
    message: 'File uploaded successfully',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl
    }
  });
}));

// Upload to Supabase Storage (alternative to local storage)
router.post('/supabase/:bucket', authenticateToken, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { bucket } = req.params;
  const filePath = `${req.userId}/${req.file.filename}`;

  // Read file buffer
  const fs = await import('fs/promises');
  const fileBuffer = await fs.readFile(req.file.path);

  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: req.file.mimetype,
      upsert: true
    });

  // Delete local file after upload
  await fs.unlink(req.file.path);

  if (error) {
    console.error('Supabase storage error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  res.json({
    message: 'File uploaded successfully',
    file: {
      path: data.path,
      url: publicUrl
    }
  });
}));

// Delete file from Supabase Storage
router.delete('/supabase/:bucket/*', authenticateToken, asyncHandler(async (req, res) => {
  const { bucket } = req.params;
  const filePath = req.params[0]; // Get the rest of the path

  // Ensure user can only delete their own files
  if (!filePath.startsWith(req.userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error('Supabase storage delete error:', error);
    return res.status(500).json({ error: 'Failed to delete file' });
  }

  res.json({ message: 'File deleted successfully' });
}));

export default router;



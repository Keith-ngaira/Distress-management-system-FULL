import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { authenticateToken, authorize } from '../middleware/auth.js';
import { 
    uploadAttachment,
    getAttachments,
    downloadAttachment,
    deleteAttachment
} from '../controllers/attachmentController.js';

const router = express.Router();

// Create uploads directory if it doesn't exist
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create a safe filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Allow only certain file types
    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images, PDFs, Word documents and text files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// Attachment routes
router.post(
    '/:distressMessageId/upload',
    authenticateToken,
    authorize(['upload_attachments']),
    upload.single('file'),
    handleMulterError,
    uploadAttachment
);

router.get(
    '/:distressMessageId',
    authenticateToken,
    authorize(['view_all_messages', 'view_assigned_messages', 'view_assigned_cases']),
    getAttachments
);

router.get(
    '/download/:id',
    authenticateToken,
    authorize(['view_all_messages', 'view_assigned_messages', 'view_assigned_cases']),
    downloadAttachment
);

router.delete(
    '/:id',
    authenticateToken,
    authorize(['manage_users']),
    deleteAttachment
);

export default router;

export { router as attachmentRoutes };

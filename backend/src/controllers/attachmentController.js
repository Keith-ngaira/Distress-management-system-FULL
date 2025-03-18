import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db, { executeQuery } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadAttachment = async (req, res) => {
    try {
        const { distressMessageId } = req.params;

        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const [result] = await executeQuery(
            'INSERT INTO attachments (message_id, filename, filesize, filetype, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
            [
                distressMessageId,
                req.file.originalname,
                req.file.size,
                req.file.mimetype,
                req.file.path,
                req.user.id
            ]
        );

        res.status(201).json({
            message: 'File uploaded successfully',
            attachment: {
                id: result.insertId,
                filename: req.file.originalname,
                filesize: req.file.size,
                filetype: req.file.mimetype,
                file_url: req.file.path
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
};

export const getAttachments = async (req, res) => {
    try {
        const { distressMessageId } = req.params;

        const [attachments] = await executeQuery(
            `SELECT 
                a.*,
                u.username as uploaded_by_username
            FROM attachments a
            LEFT JOIN users u ON a.uploaded_by = u.id
            WHERE a.message_id = ?`,
            [distressMessageId]
        );

        res.json(attachments);
    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({ message: 'Error retrieving attachments' });
    }
};

export const downloadAttachment = async (req, res) => {
    try {
        const [attachments] = await executeQuery(
            'SELECT * FROM attachments WHERE id = ?',
            [req.params.id]
        );

        if (!attachments.length) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const attachment = attachments[0];
        const filePath = path.join(__dirname, '..', '..', attachment.file_url);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.download(filePath, attachment.filename);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Error downloading file' });
    }
};

export const deleteAttachment = async (req, res) => {
    try {
        // Get attachment info
        const [attachments] = await executeQuery(
            'SELECT * FROM attachments WHERE id = ?',
            [req.params.id]
        );

        if (!attachments.length) {
            return res.status(404).json({ message: 'Attachment not found' });
        }

        const attachment = attachments[0];

        // Delete file from disk
        const filePath = path.join(__dirname, '..', '..', attachment.file_url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await executeQuery(
            'DELETE FROM attachments WHERE id = ?',
            [req.params.id]
        );

        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting attachment' });
    }
};

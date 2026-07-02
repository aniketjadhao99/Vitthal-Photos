const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const { GridFSBucket, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

const storage = multer.memoryStorage();

const sanitizeFileName = (name) => {
    return String(name || 'upload')
        .replace(/[\\/\0]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9._-]/g, '')
        .slice(0, 120);
};

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.match(/image\/(jpeg|jpg|png|webp)/)) {
            cb(new Error('Only image files are allowed!'), false);
        } else {
            cb(null, true);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024, files: 1, parts: 2 }
});

const getGridFSBucket = () => {
    if (!mongoose.connection?.db) {
        throw new Error('MongoDB connection not available');
    }

    return new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
};

const compressImageBuffer = async (buffer, mimetype) => {
    const isPng = mimetype === 'image/png';
    const isWebp = mimetype === 'image/webp';

    const transformer = sharp(buffer).resize({
        width: 1600,
        height: 1600,
        fit: 'inside',
        withoutEnlargement: true,
    });

    if (isPng) {
        const output = await transformer.png({ quality: 85, compressionLevel: 9 }).toBuffer();
        return { buffer: output, contentType: 'image/png' };
    }

    if (isWebp) {
        const output = await transformer.webp({ quality: 82 }).toBuffer();
        return { buffer: output, contentType: 'image/webp' };
    }

    const output = await transformer.jpeg({ quality: 82, progressive: true, mozjpeg: true }).toBuffer();
    return { buffer: output, contentType: 'image/jpeg' };
};

const storeFileInMongo = async (file) => {
    if (!file || !file.buffer) {
        throw new Error('No file data provided');
    }

    const bucket = getGridFSBucket();
    const filename = sanitizeFileName(file.originalname || 'upload');
    const compressed = await compressImageBuffer(file.buffer, file.mimetype);
    const uploadStream = bucket.openUploadStream(filename, {
        contentType: compressed.contentType || file.mimetype || 'application/octet-stream',
        metadata: {
            uploadedAt: new Date(),
            originalName: filename,
            compressed: true,
            source: 'mongo-gridfs',
        },
    });

    return new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
            resolve({
                id: uploadStream.id.toString(),
                filename,
                contentType: file.mimetype || 'application/octet-stream',
            });
        });
        uploadStream.end(compressed.buffer);
    });
};

const getFileFromMongo = async (fileId) => {
    const bucket = getGridFSBucket();
    const objectId = new ObjectId(fileId);
    const file = await bucket.find({ _id: objectId }).next();

    if (!file) {
        return null;
    }

    return {
        stream: bucket.openDownloadStream(objectId),
        file,
    };
};

const deleteFileFromMongo = async (fileId) => {
    const bucket = getGridFSBucket();
    const objectId = new ObjectId(fileId);
    return bucket.delete(objectId);
};

module.exports = { upload, storeFileInMongo, getFileFromMongo, deleteFileFromMongo, compressImageBuffer };

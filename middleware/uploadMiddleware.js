const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const useS3 = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_BUCKET_NAME;

let storage;
let s3 = null;

if (useS3) {
    s3 = new S3Client({
        region: process.env.AWS_REGION || 'ap-south-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
    });

    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const extension = file.originalname.substring(file.originalname.lastIndexOf('.'));
            cb(null, `uploads/${file.fieldname}-${uniqueSuffix}${extension}`);
        },
    });
} else {
    console.warn('⚠️ AWS S3 configuration missing. Falling back to local disk storage for uploads.');
    
    // Create local uploads folder if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const extension = file.originalname.substring(file.originalname.lastIndexOf('.'));
            const filename = `${file.fieldname}-${uniqueSuffix}${extension}`;
            
            // Mock S3 file properties so controllers/routes don't crash
            file.location = `/uploads/${filename}`;
            file.key = `uploads/${filename}`;
            
            cb(null, filename);
        }
    });
}

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.match(/image\/(jpeg|jpg|png|webp)/)) {
            cb(new Error('Only image files are allowed!'), false);
        } else {
            cb(null, true);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = { upload, s3 };

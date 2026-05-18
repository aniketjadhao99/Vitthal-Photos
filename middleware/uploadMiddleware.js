const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');

dotenv.config();

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const upload = multer({
    storage: multerS3({
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
    }),
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

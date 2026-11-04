import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req) => ({
    folder: `customer-personalization/${Number(req.params.productId)}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  }),
});

const customerImageUpload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
});

export default customerImageUpload;

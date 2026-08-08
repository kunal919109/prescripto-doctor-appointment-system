import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name:  process.env.CLOUDINARY_NAME,
  api_key:     process.env.CLOUDINARY_API_KEY,
  api_secret:  process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Upload an image buffer to Cloudinary.
 * @param {Buffer} buffer     - File buffer from Multer memoryStorage
 * @param {Object} options    - Additional Cloudinary upload options (optional)
 * @returns {Promise<Object>} - Cloudinary result object containing secure_url
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'prescripto',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Convert buffer to readable stream and pipe to Cloudinary
    Readable.from(buffer).pipe(uploadStream);
  });
};

export default cloudinary;

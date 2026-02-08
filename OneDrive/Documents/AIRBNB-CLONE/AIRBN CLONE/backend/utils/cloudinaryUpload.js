const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer();

async function uploadToCloudinary(buffer) {
  // Debug: print Cloudinary config before upload
  console.log('Cloudinary config at upload:', {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key,
    api_secret: cloudinary.config().api_secret ? '***set***' : undefined
  });
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (result) {
        resolve(result.secure_url);
      } else {
        reject(error);
      }
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { upload, uploadToCloudinary };

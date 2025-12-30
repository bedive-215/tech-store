import cloudinary from "../configs/cloudinary.config.js";
import streamifier from "streamifier";

/**
 * Upload file buffer lên Cloudinary — hỗ trợ cả IMAGE và VIDEO
 * @param {Buffer} buffer 
 * @param {"image" | "video"} resourceType 
 * @param {string} folder 
 * @returns {Promise<object>} { url, public_id, resource_type, format, width, height, duration }
 */
export const uploadMediaToCloudinary = (
  buffer,
  resourceType = "image",
  folder = "product_media"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType, // "image" hoặc "video"
      },
      (error, result) => {
        if (error) return reject(error);

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          resource_type: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          duration: result.duration || null
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const detectResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  throw new Error("Unsupported file type");
};

export const uploadMultipleMedia = async (files) => {
  const results = [];

  for (const file of files) {
    const type = detectResourceType(file.mimetype);
    const upload = await uploadMediaToCloudinary(file.buffer, type);
    
    results.push({
      url: upload.url,
      type,
      public_id: upload.public_id,
      duration: upload.duration
    });
  }

  return results;
};

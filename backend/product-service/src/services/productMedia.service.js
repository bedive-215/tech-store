// services/product.service.js
import models from "../models/index.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import { uploadMultipleMedia, uploadMediaToCloudinary, detectResourceType } from "../utils/uploadMedia.js";

class ProductMediaService {
    constructor() {
        this.Product = models.Product;
        this.ProductMedia = models.ProductMedia;
    }

    async uploadProductMedia(product_id, files) {
        const product = await this.Product.findByPk(product_id);
        if (!product) throw new AppError("Product not found", 404);

        if (!files || files.length === 0) {
            throw new AppError("No media files provided", 400);
        }

        const uploadedMedia = await uploadMultipleMedia(files);

        const mediaToInsert = uploadedMedia.map(item => ({
            product_id,
            url: item.url,
            type: item.type,
            is_primary: false
        }));

        await this.ProductMedia.bulkCreate(mediaToInsert);

        return {
            message: "Media uploaded successfully",
            product_id,
            uploaded: mediaToInsert.length,
            media: mediaToInsert
        };
    }

    async setPrimaryImage(product_id, file) {
        // Kiểm tra product
        const product = await this.Product.findByPk(product_id);
        if (!product) throw new AppError("Product not found", 404);

        if (!file) {
            throw new AppError("No image uploaded", 400);
        }

        // Detect loại file
        const mimetype = file.mimetype;
        if (!mimetype.startsWith("image/")) {
            throw new AppError("Primary image must be an image", 400);
        }

        // Upload Cloudinary
        const resourceType = detectResourceType(mimetype);

        const uploaded = await uploadMediaToCloudinary(file.buffer, resourceType, "product_media");

        // Bỏ primary cũ
        await this.ProductMedia.update(
            { is_primary: false },
            { where: { product_id } }
        );

        // Tạo media mới và set is_primary = true
        const newMedia = await this.ProductMedia.create({
            product_id,
            url: uploaded.url,
            type: resourceType,
            is_primary: true
        });

        return {
            message: "Primary image updated successfully",
            product_id,
            media: {
                id: newMedia.id,
                url: newMedia.url,
                is_primary: true
            }
        };
    }

    async deleteMedia(product_id, media_id) {
        const media = await this.ProductMedia.findOne({
            where: { id: media_id, product_id }
        });

        if (!media) {
            throw new AppError("Media not found for this product", 404);
        }

        // Nếu là ảnh primary → reset primary
        if (media.is_primary) {
            // tìm 1 ảnh khác để set primary mới
            const anotherImage = await this.ProductMedia.findOne({
                where: {
                    product_id,
                    id: { [Op.ne]: media_id },
                    type: "image"
                }
            });

            if (anotherImage) {
                await anotherImage.update({ is_primary: true });
            }
        }

        await media.destroy();

        return {
            status: "deleted",
            media_id
        };
    }

    /**
     * Upload image from external URL to Cloudinary
     */
    async uploadFromUrl(product_id, imageUrl) {
        const product = await this.Product.findByPk(product_id);
        if (!product) throw new AppError("Product not found", 404);

        try {
            // Import axios dynamically
            const axios = (await import('axios')).default;

            // Fetch image from URL
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const buffer = Buffer.from(response.data);
            const contentType = response.headers['content-type'] || 'image/jpeg';
            const resourceType = contentType.includes('image') ? 'image' : 'raw';

            // Upload to Cloudinary
            const uploaded = await uploadMediaToCloudinary(buffer, resourceType, "product_media");

            // Check if product has any primary image
            const existingPrimary = await this.ProductMedia.findOne({
                where: { product_id, is_primary: true }
            });

            // Create new media record
            const newMedia = await this.ProductMedia.create({
                product_id,
                url: uploaded.url,
                type: resourceType,
                is_primary: !existingPrimary // Set as primary if no existing primary
            });

            return {
                success: true,
                message: "Image uploaded from URL successfully",
                product_id,
                media: {
                    id: newMedia.id,
                    url: newMedia.url,
                    is_primary: newMedia.is_primary
                }
            };
        } catch (error) {
            console.error("Upload from URL error:", error.message);
            throw new AppError("Failed to upload image from URL: " + error.message, 500);
        }
    }

}

export default new ProductMediaService();

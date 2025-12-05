import models from "../models/index.js";
import { AppError } from "../middlewares/errorHandler.middleware.js";
import slugify from "slugify";
import { uploadMediaToCloudinary, detectResourceType } from "../utils/uploadMedia.js";

const { Brand } = models;

class BrandService {

    constructor() {
        this.Brand = Brand;
    }

    // GET /api/v1/brands
    async getBrands() {
        const brands = await this.Brand.findAll({
            order: [["name", "ASC"]],
            attributes: ["id", "name", "slug", "logo"]
        });

        return { brands };
    }

    // POST /api/v1/brands
    async createBrand(data) {
        const { name, file } = data;

        // Validate name
    if (!name || !name.trim()) {
        throw new AppError("Brand name is required", 400);
    }

    // Validate file
    if (!file) {
        throw new AppError("Brand logo is required", 400);
    }

        const mimetype = file.mimetype;
        if (!mimetype.startsWith("image/")) {
            throw new AppError("Logo must be an image", 400);
        }
        const resourceType = detectResourceType(mimetype);
        const uploaded = await uploadMediaToCloudinary(file.buffer, resourceType, "brands_logo");
        

        const slug = slugify(name, { lower: true, strict: true });

        // Check brand trùng
        const exists = await this.Brand.findOne({ where: { slug } });
        if (exists) {
            throw new AppError("Brand already exists", 400);
        }

        const brand = await this.Brand.create({
            name,
            logo: uploaded.url,
            slug
        });

        return {
            message: "Brand created successfully",
            brand: {
                brand_id: brand.id,
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo
            }
        };
    }

    // DELETE /api/v1/brands/:id
    async deleteBrand(brand_id) {
        const brand = await this.Brand.findByPk(brand_id);

        if (!brand) {
            throw new AppError("Brand not found", 404);
        }

        await brand.destroy();

        return {
            status: "deleted",
            brand_id
        };
    }
}

export default new BrandService();

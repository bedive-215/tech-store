import productMediaService from "../services/productMedia.service.js";

class ProductMediaController {
    
    async uploadProductMedia(req, res, next) {
        try {
            const { product_id } = req.params;
            const files = req.files;

            const result = await productMediaService.uploadProductMedia(product_id, files);

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async setPrimaryImage(req, res, next) {
        try {
            const { product_id } = req.params;
            const file = req.file;

            const result = await productMediaService.setPrimaryImage(product_id, file);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async deleteMedia(req, res, next) {
        try {
            const { product_id } = req.params;
            const { media_id } = req.body;

            const result = await productMediaService.deleteMedia(product_id, media_id);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new ProductMediaController();

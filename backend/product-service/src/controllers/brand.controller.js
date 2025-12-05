import BrandService from "../services/brand.service.js";

class BrandController {

    async getBrands(req, res, next) {
        try {
            const data = await BrandService.getBrands();
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async createBrand(req, res, next) {
        try {
            const data = {
                name: req.body.name.trim(),
                file: req.file
            }
            const result = await BrandService.createBrand(data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async deleteBrand(req, res, next) {
        try {
            const data = await BrandService.deleteBrand(req.params.id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
}

export default new BrandController();

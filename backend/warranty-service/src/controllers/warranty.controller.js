import WarrantyService from "../services/warranty.service.js";

class WarrantyController {

    // Tạo yêu cầu bảo hành
    async createWarranty(req, res, next) {
        try {
            const result = await WarrantyService.createReqWarranty(
                req.user.id,
                {
                    ...req.body,
                    files: req.files
                }
            );

            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    // Cập nhật trạng thái bảo hành (ADMIN)
    async updateWarrantyStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const warranty = await WarrantyService.updateWarrantyStatus(id, status);

            res.status(200).json({
                message: "Warranty status updated successfully",
                warranty
            });

        } catch (err) {
            next(err);
        }
    }

    // Admin lấy tất cả warranty
    async getAllWarranty(req, res, next) {
        try {
            const result = await WarrantyService.getAllWarranty(req.query);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    // User lấy warranty của mình
    async getMyWarranty(req, res, next) {
        try {
            const result = await WarrantyService.getWarrantyByUserID(
                req.user.id,
                req.query
            );

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    async validateWarranty (req, res, next) {
        try {
            const result = await WarrantyService.validateWarranty(req.params.warranty_id);

            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new WarrantyController();

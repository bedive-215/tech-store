import FlashSaleService from "../services/flashSale.service.js";

class FlashSaleController {

    async createFlashSale(req, res, next) {
        try {
            const data = {
                name: req.body.name?.trim(),
                start_at: req.body.start_at,
                end_at: req.body.end_at
            };

            const result = await FlashSaleService.createFlashSale(data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }

    async getActiveFlashSales(req, res, next) {
        try {
            const data = await FlashSaleService.getActiveFlashSales();
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async getFlashSaleDetail(req, res, next) {
        try {
            const data = await FlashSaleService.getFlashSaleDetail(req.params.id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }

    async addItem(req, res, next) {
        try {
            const result = await FlashSaleService.addItem(
                req.params.id,
                {
                    product_id: req.body.product_id,
                    sale_price: req.body.sale_price,
                    stock_limit: req.body.stock_limit,
                }
            );
            res.status(201).json(result);
        } catch (err) {
            console.log(err);
            next(err);
        }
    }

    async removeItem(req, res, next) {
        try {
            const data = await FlashSaleService.removeItem(req.params.item_id);
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    }
}

export default new FlashSaleController();

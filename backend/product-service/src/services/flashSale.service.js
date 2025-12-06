import { AppError } from "../middlewares/errorHandler.middleware.js";
import { Op } from "sequelize";
import models from "../models/index.js";

class FlashSaleService {
    constructor() {
        this.FlashSale = models.FlashSale;
        this.FlashSaleItem = models.FlashSaleItem;
        this.Product = models.Product;
    }

    async createFlashSale(data) {
        const { name, start_at, end_at } = data;

        if (!name || !start_at || !end_at) {
            throw new AppError("Missing required fields", 400);
        }

        return await this.FlashSale.create({
            name,
            start_at,
            end_at
        });
    }

    async getActiveFlashSales() {
        const now = new Date();

        return await this.FlashSale.findAll({
            where: {
                start_at: { [Op.lte]: now },
                end_at: { [Op.gte]: now }
            },
            include: [
                {
                    model: this.FlashSaleItem,
                    as: "items",
                    where: {
                        stock_limit: { [Op.gt]: 0 }
                    },
                    required: false
                }
            ]
        });
    }

    async getFlashSaleDetail(id) {
        const sale = await this.FlashSale.findByPk(id, {
            include: [
                {
                    model: this.FlashSaleItem,
                    as: "items",
                    where: {
                        stock_limit: { [Op.gt]: 0 }
                    },
                    required: false,
                    include: [
                        {
                            model: this.Product,
                            as: "product"
                        }
                    ]
                }
            ]
        });

        if (!sale) throw new AppError("Flash sale not found", 404);

        return sale;
    }

    async addItem(flash_sale_id, data) {
        const { product_id, sale_price, stock_limit } = data;

        if (!product_id || !sale_price || stock_limit == null) {
            throw new AppError("Missing required fields", 400);
        }

        const sale = await this.FlashSale.findByPk(flash_sale_id);
        if (!sale) throw new AppError("Flash sale not found", 404);

        const product = await this.Product.findByPk(product_id);
        if (!product) throw new AppError("Product not found", 404);

        return await this.FlashSaleItem.create({
            flash_sale_id,
            product_id,
            sale_price,
            stock_limit
        });
    }

    async removeItem(item_id) {
        const item = await this.FlashSaleItem.findByPk(item_id);
        if (!item) throw new AppError("Flash sale item not found", 404);

        await item.destroy();

        return {
            status: "removed",
            item_id
        };
    }

    async decreaseFlashSaleStock(item_id, quantity) {
        const item = await this.FlashSaleItem.findByPk(item_id);
        if (!item) throw new AppError("Flash sale item not found", 404);

        item.stock_limit -= quantity;

        if (item.stock_limit <= 0) {
            await item.destroy();
            return { status: "removed" };
        }

        await item.save();
        return { status: "updated", stock_left: item.stock_limit };
    }
}

export default new FlashSaleService();

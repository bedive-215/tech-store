import sequelize from "../configs/db.config.js";
import Warranty from "../models/warranty.model.js";
import RabbitMQ from "../configs/rabbitmq.config.js"
import { AppError } from "../middlewares/errorHandler.middleware.js";
import { Op } from 'sequelize';
import crypto from "crypto";
import uploadMultipleMedia from "../utils/uploadMultipleMedia.js";

class WarrantyService {

    constructor() {
        this._promiseMap = new Map();
        this.RabbitMQ = RabbitMQ;
    }

    async createReqWarranty(user_id, data) {

        const t = await sequelize.transaction();

        try {
            const {
                product_id,
                order_id,
                files,
                serial,
                issue_description
            } = data;

            if (!user_id || !product_id || !order_id || !issue_description) {
                throw new AppError("Missing required fields", 400);
            }

            let mediaUrls = null;
            if (files?.length > 0) {
                mediaUrls = await uploadMultipleMedia(files);
            }

            const warranty = await Warranty.create({
                user_id,
                product_id,
                order_id,
                serial: serial || null,
                issue_description,
                url: mediaUrls ? JSON.stringify(mediaUrls) : null,
                status: "pending"
            }, { transaction: t });

            await t.commit();

            return {
                message: "Warranty request created successfully",
                warranty
            };

        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async updateWarrantyStatus(warranty_id, status) {

        const allowStatus = ['pending', 'approved', 'completed', 'rejected'];

        if (!allowStatus.includes(status)) {
            throw new AppError('Invalid warranty status', 400);
        }

        const warranty = await Warranty.findByPk(warranty_id);

        if (!warranty) {
            throw new AppError('Warranty not found', 404);
        }

        if (warranty.is_valid === false) {
            throw new AppError('This request not valid!', 400);
        }

        if (warranty.status === 'completed') {
            throw new AppError('Warranty already completed', 400);
        }

        if (warranty.status === 'rejected') {
            throw new AppError('Warranty already rejected', 400);
        }

        if (warranty.status === 'pending' && status === 'completed') {
            throw new AppError('Cannot complete warranty before approval', 400);
        }

        if (warranty.status === 'approved' && status === 'rejected') {
            throw new AppError('Cannot reject after approval', 400);
        }

        warranty.status = status;
        await warranty.save();

        return warranty;
    }

    async getAllWarranty(query = {}) {
        let {
            page = 1,
            limit = 20,
            status,
            search
        } = query;

        page = Number(page) || 1;
        limit = Number(limit) || 20;
        const offset = (page - 1) * limit;

        const where = {};

        // filter theo trạng thái
        if (status) {
            where.status = status;
        }

        // tìm theo serial hoặc order_id
        if (search) {
            where[Op.or] = [
                { serial: { [Op.like]: `%${search}%` } },
                { order_id: { [Op.like]: `%${search}%` } }
            ];
        }

        const { rows, count } = await Warranty.findAndCountAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset
        });

        return {
            warranties: rows,
            total: count,
            page,
            limit
        };
    }

    async getWarrantyByUserID(user_id, query = {}) {

        if (!user_id) throw new AppError("user_id is required", 400);

        let {
            page = 1,
            limit = 20,
            status
        } = query;

        page = Number(page) || 1;
        limit = Number(limit) || 20;
        const offset = (page - 1) * limit;

        const where = { user_id };

        if (status) where.status = status;

        const { rows, count } = await Warranty.findAndCountAll({
            where,
            order: [["created_at", "DESC"]],
            limit,
            offset
        });

        return {
            warranties: rows,
            total: count,
            page,
            limit
        };
    }

    async validateWarranty(warranty_id) {
        if (!warranty_id) throw new AppError('Data required!', 400);
        const warranty = await Warranty.findByPk(warranty_id);
        if (!warranty) throw new AppError('Warranty not found!', 404);

        const correlationId = crypto.randomUUID();
        const validate = new Promise((resolve, reject) => {
            this._promiseMap.set(correlationId, resolve);
            setTimeout(() => {
                if (this._promiseMap.has(correlationId)) {
                    this._promiseMap.delete(correlationId);
                    reject(new AppError("Product service timeout", 504));
                }
            }, 5000);
        });

        await this.RabbitMQ.publish('validate_warranty', { product_id: warranty.product_id, order_id: warranty.order_id, correlationId });

        const result = await validate;

        if (result?.valid === true) {
            warranty.status = 'approved';
            warranty.is_valid = true;
            await warranty.save();
        }

        return {
            valid: !!result?.valid,
            reason: result?.reason ?? null,
            warranty
        };
    }

    async handelMessages() {
        this.RabbitMQ.subscribe('validate_warranty_queue', async (data, rk) => {
            if (rk !== 'warranty_result') return;
            const { correlationId } = data;
            const resolver = this._promiseMap.get(correlationId);
            if(resolver) {
                resolver(data);
                this._promiseMap.delete(correlationId);
            }
        });
    }
}

export default new WarrantyService();

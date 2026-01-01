import sequelize from "../configs/db.config.js";
import Warranty from "../models/warranty.model.js";
import RabbitMQ from "../configs/rabbitmq.config.js"
import { AppError } from "../middlewares/errorHandler.middleware.js";
import { Op } from 'sequelize';
import crypto from "crypto";
import { uploadMultipleMedia } from "../utils/uploadMedia.js";

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

            const url = mediaUrls.map((it) => it.url);
            // console.log(url);

            const warranty = await Warranty.create({
                user_id,
                product_id,
                order_id,
                serial: serial || null,
                issue_description,
                url: mediaUrls ? JSON.stringify(url) : null,
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

    async updateWarrantyStatus(warranty_id, nextStatus) {

        const VALID_STATES = ['pending', 'approved', 'completed', 'rejected'];

        if (!VALID_STATES.includes(nextStatus)) {
            throw new AppError('Invalid warranty status', 400);
        }

        const warranty = await Warranty.findByPk(warranty_id);

        if (!warranty) {
            throw new AppError('Warranty not found', 404);
        }

        if (warranty.is_valid === false) {
            throw new AppError('This request not valid!', 400);
        }

        const ALLOWED_TRANSITIONS = {
            pending: ['approved', 'rejected'],
            approved: ['completed'],
            completed: [],
            rejected: []
        };

        const current = warranty.status;

        if (!ALLOWED_TRANSITIONS[current].includes(nextStatus)) {
            throw new AppError(
                `Cannot change status from ${current} to ${nextStatus}`,
                400
            );
        }

        warranty.status = nextStatus;
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

        // tìm theo serial, order_id hoặc product_id
        if (search) {
            where[Op.or] = [
                { serial: { [Op.like]: `%${search}%` } },
                { order_id: { [Op.like]: `%${search}%` } },
                { product_id: { [Op.like]: `%${search}%` } },
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
        if (warranty.status !== 'pending') throw new AppError(`Warranty request was ${warranty.status}`, 400);

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
        } else {
            warranty.status = 'rejected';
            warranty.is_valid = false;
        }

        await warranty.save();

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
            if (resolver) {
                resolver(data);
                this._promiseMap.delete(correlationId);
            }
        });
    }
}

export default new WarrantyService();

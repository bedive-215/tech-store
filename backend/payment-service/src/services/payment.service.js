import models from "../models/index.js";
import { AppError } from '../middlewares/errorHandler.middleware.js';
import RabbitMQ from "../configs/rabbitmq.config.js";
import 'dotenv/config';
import crypto from 'crypto';

import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';

class PaymentService {

    constructor() {
        this.Payment = models.Payment;
        this.RabbitMQ = RabbitMQ;
        this._promiseMap = new Map();
    }

    generateTxnRef(orderId, useTimestamp = true) {
        if (useTimestamp) {
            const timestamp = Date.now();
            return `${orderId}_${timestamp}`;
        }
        return orderId;
    }

    async createPayment(order_id, user_id, platform) {
        if (!order_id || !user_id || !platform) throw new AppError('Data are required', 400);

        const txnRef = this.generateTxnRef(order_id);

        const correlationId = crypto.randomUUID();

        const amountPromise = new Promise((resolve, reject) => {
            this._promiseMap.set(correlationId, resolve);

            setTimeout(() => {
                if (this._promiseMap.has(correlationId)) {
                    this._promiseMap.delete(correlationId);
                    reject(new AppError("Order service timeout", 504));
                }
            }, 5000);
        });

        await this.RabbitMQ.publish('order_amount_get', {
            order_id,
            correlationId
        });

        const amount = await amountPromise;
        if (!amount) {
            throw new AppError('Order service did not return an amount', 400);
        }

        const payment = await this.Payment.create({
            txn_ref: txnRef,
            order_id,
            user_id,
            amount,
            platform,
            status: "pending",
            metadata: {
                sdk: "vnpay",
                created: new Date()
            }
        });

        const vnpay = new VNPay({
            tmnCode: process.env.VNP_TMN_CODE,
            secureSecret: process.env.VNP_HASH_SECRET,
            vnpayHost: process.env.VNP_URL,
            testMode: true,
            hashAlgorithm: 'SHA512',
            loggerFn: ignoreLogger
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const vnpayResponse = await vnpay.buildPaymentUrl({
            vnp_Amount: amount,
            vnp_IpAddr: '127.0.0.1',
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `Thanh toán đơn hàng ${order_id}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: process.env.VNP_RETURN_URL,
            vnp_Locale: VnpLocale.VN,
            vnp_CreateDate: dateFormat(new Date()),
            vnp_ExpireDate: dateFormat(tomorrow)
        });

        return {
            vnpayUrl: vnpayResponse,
            payment_id: payment.id
        }
    }

    async handleCallback(query) {
        const vnpay = new VNPay({
            tmnCode: process.env.VNP_TMN_CODE,
            secureSecret: process.env.VNP_HASH_SECRET,
            testMode: true
        });

        const result = vnpay.verifyReturnUrl(query);

        const txnRef = result.vnp_TxnRef;

        const payment = await this.Payment.findOne({
            where: { txn_ref: txnRef }
        });

        if (!payment) {
            throw new Error("Payment not found for txnRef: " + txnRef);
        }

        const status = result.vnp_ResponseCode === "00" ? "success" : "failed";
        // console.log('status:', status);
        // console.log(query);
        if (status === 'success') {
            await this.RabbitMQ.publish('payment_success', { order_id: payment.order_id });
        }

        await payment.update({
            status,
            transaction_id: result.vnp_TransactionNo,
            metadata: result
        });

        return payment;
    }

    async initMessageHandlers() {
        this.RabbitMQ.subscribe('payment_order_amount_queue', (data, rk) => {
            if (rk !== 'order_amount_result') return;
            const { correlationId, amount } = data;
            const resolver = this._promiseMap.get(correlationId);
            if (resolver) {
                resolver(amount);
                this._promiseMap.delete(correlationId);
            }
        });
    }
}

export default new PaymentService();
import paymentService from "../services/payment.service.js";

class PaymentController {

    async createPayment(req, res, next) {
        try {
            const { order_id, platform } = req.body;
            const user_id = req.user.id;
            const { vnpayUrl, payment_id } = await paymentService.createPayment(order_id, user_id, platform);

            return res.status(200).json({
                success: true,
                message: "Payment created successfully",
                vnpayUrl,
                payment_id
            });
        } catch (error) {
            console.log('Payment Error:', error);
            next(error);
        }
    }

    async paymentCallback(req, res, next) {
        try {
            const payment = await paymentService.handleCallback(req.query);

            const isSuccess = payment.status === 'success';

            if (payment.platform === 'web') {
                return res.redirect(
                    isSuccess
                        ? `http://localhost:5173/payment-success?order_id=${payment.order_id}`
                        : `http://localhost:5173/payment-failed?order_id=${payment.order_id}`
                );
            }

            if (payment.platform === 'app') {
                // console.log('Payment in app.');
                return res.redirect(
                    isSuccess
                        ? `http://localhost:8081/payment-success?order_id=${payment.order_id}`
                        : `http://localhost:8081/payment-failed?order_id=${payment.order_id}`
                );
            }

            throw new Error('Unknown platform');
        } catch (err) {
            next(err);
        }
    }

}

export default new PaymentController();

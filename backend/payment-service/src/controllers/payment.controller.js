import paymentService from "../services/payment.service.js";

class PaymentController {

    async createPayment(req, res, next) {
        try {
            const { order_id } = req.body;
            const user_id = req.user.id;
            const {vnpayUrl, payment_id} = await paymentService.createPayment(order_id, user_id);

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
            const query = req.query;
            const payment = await paymentService.handleCallback(query);

            if (payment.status === 'success') {
                return res.redirect(`http://localhost:5173/payment-success?order_id=${payment.order_id}`);
            }

            // Thanh toán thất bại
            return res.redirect(`http://localhost:5173/payment-failed?order_id=${payment.order_id}`);

        } catch (error) {
            next(error);
        }
    }
}

export default new PaymentController();

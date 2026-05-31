import aiService from "../services/ai.service.js";

/**
 * AI Controller - Generate product details using AI
 */
class AIController {
    /**
     * POST /api/v1/products/ai/generate
     * Body: { name: string, specs: string }
     */
    async generate(req, res) {
        try {
            const { name, specs } = req.body;

            if (!name || !specs) {
                return res.status(400).json({
                    success: false,
                    message: "Vui lòng nhập tên sản phẩm và cấu hình"
                });
            }

            const result = await aiService.generateProductDetails(name, specs);

            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error("AI Generate Error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Lỗi khi tạo nội dung AI"
            });
        }
    }
}

export default new AIController();

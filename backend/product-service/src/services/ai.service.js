import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    /**
     * Generate product details from name and specs
     */
    async generateProductDetails(name, specs) {
        const prompt = `Bạn là chuyên gia viết mô tả sản phẩm công nghệ cho website thương mại điện tử Việt Nam.

Sản phẩm: ${name}
Cấu hình: ${specs}

Trả về JSON với format CHÍNH XÁC như sau (không có markdown, chỉ JSON thuần):
{
  "description": "Mô tả hấp dẫn 100-150 từ tiếng Việt, SEO-friendly, highlight các tính năng nổi bật",
  "suggestedPrice": số tiền VNĐ (chỉ số, không có đơn vị, dựa trên giá thị trường Việt Nam 2024-2025),
  "brand": "Tên hãng sản xuất",
  "category": "Một trong các category: Điện thoại, Laptop, Tai nghe, Bàn phím cơ"
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.`;

        try {
            const result = await this.model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean response - remove markdown code blocks if present
            let cleanJson = responseText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const parsed = JSON.parse(cleanJson);

            // Fetch product image
            const imageUrl = await this.fetchProductImage(name);

            return {
                description: parsed.description,
                suggestedPrice: Number(parsed.suggestedPrice),
                brand: parsed.brand,
                category: parsed.category,
                imageUrl: imageUrl
            };
        } catch (error) {
            console.error("AI Generation Error:", error);
            throw new Error("Failed to generate product details: " + error.message);
        }
    }

    /**
     * Fetch product image from web (using placeholder for now)
     * Can be upgraded to use Google Custom Search API
     */
    async fetchProductImage(productName) {
        // Simple approach: use a product image search service or placeholder
        // For production, use Google Custom Search API or SerpAPI

        const encodedName = encodeURIComponent(productName);

        // Try to get image from a reliable source
        // Using a fallback approach
        try {
            // Option 1: Use placeholder with product name
            return `https://placehold.co/600x400/1a1a1a/white?text=${encodedName.substring(0, 20)}`;
        } catch (error) {
            return null;
        }
    }
}

export default new AIService();

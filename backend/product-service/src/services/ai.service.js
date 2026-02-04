import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
     * Fetch product image from Unsplash API (free tier: 50 req/hour)
     */
    async fetchProductImage(productName) {
        try {
            // Use Unsplash API with demo access key
            // Production: register at https://unsplash.com/developers
            const UNSPLASH_ACCESS_KEY = "ab3411e4ac868c2646c0ed488dfd919ef612b04c264f3bc0571b0a36fa19a5b5";

            // Extract brand/type for better search
            const searchQuery = productName
                .replace(/\d+GB|\d+TB|\d+MP|Pro|Max|Ultra|Plus/gi, '')
                .trim();

            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery + ' product')}&per_page=1&orientation=squarish`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                if (data.results && data.results.length > 0) {
                    // Return small image URL for faster loading
                    return data.results[0].urls.small;
                }
            }

            // Fallback to styled placeholder
            return null;
        } catch (error) {
            console.error("Unsplash fetch error:", error);
            return null;
        }
    }
}

export default new AIService();

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
     * Fetch product image URL using Gemini AI to suggest a real image URL
     */
    async fetchProductImage(productName) {
        try {
            // Use Gemini to find a real product image URL
            const imagePrompt = `Bạn là chuyên gia tìm hình ảnh sản phẩm. 
Cho sản phẩm: "${productName}"

Hãy TRẢ VỀ MỘT URL ảnh sản phẩm THỰC TẾ từ các nguồn sau (chọn 1):
1. cdn.tgdd.vn (Thế Giới Di Động)
2. images.fpt.shop (FPT Shop)  
3. cdn.shopify.com
4. m.media-amazon.com
5. store.storeimages.cdn-apple.com

CHỈ TRẢ VỀ URL, KHÔNG CÓ TEXT KHÁC. URL phải là link trực tiếp đến file ảnh .jpg, .png hoặc .webp`;

            const result = await this.model.generateContent(imagePrompt);
            const imageUrl = result.response.text().trim();

            // Validate URL format
            if (imageUrl.startsWith('http') && (imageUrl.includes('.jpg') || imageUrl.includes('.png') || imageUrl.includes('.webp') || imageUrl.includes('cdn'))) {
                return imageUrl;
            }

            // Fallback: use a professional placeholder
            const brandMatch = productName.match(/(iPhone|Samsung|MacBook|iPad|Apple|Xiaomi|Sony|JBL|Logitech|Razer)/i);
            const brand = brandMatch ? brandMatch[1] : 'Tech';
            return `https://placehold.co/600x600/111827/ffffff?text=${encodeURIComponent(brand)}`;

        } catch (error) {
            console.error("Image fetch error:", error);
            return `https://placehold.co/600x600/111827/ffffff?text=Product`;
        }
    }
}

export default new AIService();

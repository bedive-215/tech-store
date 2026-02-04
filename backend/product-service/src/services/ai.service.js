import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

class AIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Text generation: gemini-2.5-flash (fast & accurate)
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        // Image generation: nano-banana-pro-preview (Gemini 3 Pro Image)
        this.imageModel = this.genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
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
     * Generate product image using Gemini 2.0 Flash Image Generation
     * Then upload to Cloudinary and return URL
     */
    async fetchProductImage(productName) {
        try {
            // Import cloudinary uploader
            const { uploadMediaToCloudinary } = await import('../utils/uploadMedia.js');

            // Create image prompt for product
            const imagePrompt = `Product photography of ${productName}, professional studio lighting, white background, high quality, e-commerce product photo, centered, 4k`;

            console.log('🎨 Generating image for:', productName);

            // Generate image using Gemini
            const result = await this.imageModel.generateContent(imagePrompt);
            const response = await result.response;

            console.log('📦 Gemini response structure:', JSON.stringify({
                hasCandidates: !!response.candidates,
                candidatesLength: response.candidates?.length,
                firstCandidate: response.candidates?.[0] ? {
                    hasContent: !!response.candidates[0].content,
                    hasParts: !!response.candidates[0].content?.parts,
                    partsLength: response.candidates[0].content?.parts?.length
                } : null
            }));

            // Check if image was generated
            if (response.candidates && response.candidates[0]?.content?.parts) {
                const part = response.candidates[0].content.parts.find(p => p.inlineData);

                if (part?.inlineData) {
                    console.log('✅ Found inline image data, uploading to Cloudinary...');
                    // Convert base64 to buffer
                    const imageBuffer = Buffer.from(part.inlineData.data, 'base64');

                    // Upload to Cloudinary
                    const uploaded = await uploadMediaToCloudinary(imageBuffer, 'image', 'ai_product_images');

                    console.log('☁️ Uploaded to Cloudinary:', uploaded.url);
                    return uploaded.url;
                } else {
                    console.log('⚠️ No inlineData found in parts');
                }
            }

            // Fallback to Picsum if generation fails
            console.log('🔄 Falling back to Picsum');
            const seed = productName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
            return `https://picsum.photos/seed/${seed}/600/600`;

        } catch (error) {
            console.error("❌ Gemini image generation error:", error.message);
            // Fallback to Picsum
            const seed = productName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
            return `https://picsum.photos/seed/${seed}/600/600`;
        }
    }
}

export default new AIService();

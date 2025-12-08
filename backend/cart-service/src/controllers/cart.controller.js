// controllers/cart.controller.js
import cartService from "../services/cart.service.js";

class CartController {
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, quantity, product_name, image_url, stock, price } = req.body;

      const item = await cartService.addItem(userId, product_id, quantity, product_name, image_url, stock, price);
      res.json({ success: true, item });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async getCart(req, res) {
    try {
      const userId = req.user.id;
      const data = await cartService.getCart(userId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateQty(req, res) {
    try {
      const userId = req.user.id;
      const { product_id, quantity } = req.body;

      const item = await cartService.updateQuantity(userId, product_id, quantity);
      res.json({ success: true, item });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const product_id = req.params.product_id;

      await cartService.removeItem(product_id, userId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async clear(req, res) {
    try {
      const userId = req.user.id;
      await cartService.clearCart(userId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default new CartController();

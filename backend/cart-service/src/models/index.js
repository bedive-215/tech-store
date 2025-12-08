import sequelize from "../configs/db.config.js";

import CartModel from "./cart.model.js";
import CartItemModel from "./cartItem.model.js";

const Cart = CartModel(sequelize);
const CartItem = CartItemModel(sequelize);

// Associations
Cart.hasMany(CartItem, {
  foreignKey: "cart_id",
  onDelete: "CASCADE"
});
CartItem.belongsTo(Cart, { foreignKey: "cart_id" });

const models = {
    CartItem, Cart, sequelize
};

export default models;
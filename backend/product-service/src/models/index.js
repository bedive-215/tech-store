import sequelize from "../configs/db.config.js";

import brandModel from "./brand.model.js";
import categoryModel from "./category.model.js";
import productMediaModel from "./productMedia.model.js";
import productModel from "./product.model.js";
import flashSaleModel from "./flashSale.model.js";
import flashSaleItemModel from "./flashSaleItem.model.js";

const Brand = brandModel(sequelize);
const Category = categoryModel(sequelize);
const Product = productModel(sequelize);
const ProductMedia = productMediaModel(sequelize);
const FlashSale = flashSaleModel(sequelize);
const FlashSaleItem = flashSaleItemModel(sequelize);

// Brand - Product
Brand.hasMany(Product, { foreignKey: "brand_id", onDelete: "CASCADE" });
Product.belongsTo(Brand, { foreignKey: "brand_id" });

// Category - Product
Category.hasMany(Product, { foreignKey: "category_id", onDelete: "CASCADE" });
Product.belongsTo(Category, { foreignKey: "category_id" });

// Product - Media
Product.hasMany(ProductMedia, { foreignKey: "product_id", onDelete: "CASCADE", as: 'media' });
ProductMedia.belongsTo(Product, { foreignKey: "product_id", as: 'product' });

// FlashSale - FlashSaleItem
FlashSale.hasMany(FlashSaleItem, { foreignKey: "flash_sale_id", onDelete: "CASCADE", as: "items" });
FlashSaleItem.belongsTo(FlashSale, { foreignKey: "flash_sale_id", as: "flash_sale" });

// Product - FlashSaleItem
Product.hasMany(FlashSaleItem, { foreignKey: "product_id", onDelete: "CASCADE" });
FlashSaleItem.belongsTo(Product, { foreignKey: "product_id", as: 'product' });

const models = {
    sequelize,
    Brand,
    Category,
    Product,
    ProductMedia,
    FlashSale,
    FlashSaleItem
};

export default models;
import { DataTypes } from "sequelize";

export default (sequelize) => {
    const FlashSaleItem = sequelize.define("FlashSaleItem", {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        flash_sale_id: {
            type: DataTypes.STRING(36),
            allowNull: false
        },
        product_id: {
            type: DataTypes.STRING(36),
            allowNull: false
        },
        sale_price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        stock_limit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        tableName: "flash_sale_items",
        timestamps: false,
        underscored: true
    });

    return FlashSaleItem;
};

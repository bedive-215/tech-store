import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Product = sequelize.define("Product", {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        brand_id: {
            type: DataTypes.STRING(36),
            allowNull: false
        },
        category_id: {
            type: DataTypes.STRING(36),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        rating_avg: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 0.0
        },
        total_reviews: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: "products",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        underscored: true
    });

    return Product;
};

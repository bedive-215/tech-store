import { DataTypes } from "sequelize";

export default (sequelize) => {
    const ProductMedia = sequelize.define("ProductMedia", {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        product_id: {
            type: DataTypes.STRING(36),
            allowNull: false
        },
        is_primary : {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false

        },
        url: {
            type: DataTypes.STRING(500),
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("image", "video"),
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: "product_media",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        underscored: true
    });

    return ProductMedia;
};

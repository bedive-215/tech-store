import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Wishlist = sequelize.define("Wishlist", {
        user_id: {
            type: DataTypes.UUID,
            primaryKey: true,
        },
        product_id: {
            type: DataTypes.UUID,
            primaryKey: true,
        }
    }, {
        tableName: "wishlist",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        underscored: true
    });

    return Wishlist;
}
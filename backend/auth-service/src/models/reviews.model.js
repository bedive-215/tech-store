import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Review = sequelize.define('Review', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        product_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    }, {
        tableName: 'reviews',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true
    });

    return Review;
};

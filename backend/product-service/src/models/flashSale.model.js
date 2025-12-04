import { DataTypes } from "sequelize";

export default (sequelize) => {
    const FlashSale = sequelize.define("FlashSale", {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        start_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        end_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: "flash_sales",
        timestamps: false,
        underscored: true
    });

    return FlashSale;
};

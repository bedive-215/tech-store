import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Category = sequelize.define("Category", {
        id: {
            type: DataTypes.STRING(36),
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        }
    }, {
        tableName: "categories",
        timestamps: false,
        underscored: true
    });

    return Category;
};

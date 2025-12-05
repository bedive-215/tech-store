import { DataTypes } from "sequelize";

export default (sequelize) => {
    const Brand = sequelize.define("Brand", {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        logo : {
            type: DataTypes.STRING(500),
            allowNull: false
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
        tableName: "brands",
        timestamps: false,
        underscored: true
    });

    return Brand;
};

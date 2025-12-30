import { DataTypes } from 'sequelize';
import sequelize from '../configs/db.config.js';

const Warranty = sequelize.define('Warranty', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },

    user_id: {
        type: DataTypes.STRING(36),
        allowNull: false
    },

    order_id: {
        type: DataTypes.STRING(36),
        allowNull: false
    },

    url: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    product_id: {
        type: DataTypes.STRING(36),
        allowNull: false
    },

    serial: {
        type: DataTypes.STRING(50),
        allowNull: true
    },

    issue_description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    is_valid: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'completed', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
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
    tableName: 'warranty',
    timestamps: false
});

export default Warranty;

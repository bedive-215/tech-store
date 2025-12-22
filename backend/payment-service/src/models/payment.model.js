// models/payment.model.js
import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Payment = sequelize.define(
    "Payment",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      txn_ref: {        
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      },

      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      amount: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      currency: {
        type: DataTypes.STRING(8),
        defaultValue: "VND",
      },

      status: {
        type: DataTypes.ENUM("pending", "success", "failed", "refunded"),
        allowNull: false,
        defaultValue: "pending",
      },

      platform: {
        type: DataTypes.ENUM("web", "app"),
        allowNull: false,
        defaultValue: "web"
      },

      transaction_id: {
        type: DataTypes.STRING(128),
        allowNull: true,
      },

      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "payments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      underscored: true,
    }
  );

  return Payment;
};

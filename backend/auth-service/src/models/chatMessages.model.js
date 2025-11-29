import { DataTypes } from "sequelize";

export default (sequelize) => {
    const ChatMessage = sequelize.define('ChatMessage', {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: DataTypes.UUIDV4
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        admin_id: {
            type: DataTypes.UUID,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        sender: {
            type: DataTypes.ENUM('user','admin'),
            allowNull: false,
        }
    }, {
        tableName: 'chat_messages',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true
    });

    return ChatMessage;
};

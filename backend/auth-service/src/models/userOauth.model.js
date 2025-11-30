export default (sequelize) => {
  const UserOAuth = sequelize.define("UserOAuth", {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    provider_uid: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  }, {
    tableName: "user_oauth_providers",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["provider_uid"] },
      { unique: true, fields: ["user_id"] },
      { fields: ["provider_uid"] },
      { fields: ["user_id"] },
    ]
  });

  return UserOAuth;
};

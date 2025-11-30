import sequelize from "../configs/db.config.js";

import usersModel from "./users.model.js";
import chatMessagesModel from "./chatMessages.model.js";
import reviewsModel from "./reviews.model.js";
import wishlistModel from "./wishlist.model.js";
import userOauthModel from "./userOauth.model.js";

const User = usersModel(sequelize);
const ChatMessage = chatMessagesModel(sequelize);
const Review = reviewsModel(sequelize);
const Wishlist = wishlistModel(sequelize);
const UserOauth = userOauthModel(sequelize);

User.hasMany(Wishlist, { foreignKey: "user_id", onDelete: "CASCADE" });
Wishlist.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(Review, { foreignKey: "user_id", onDelete: "CASCADE" });
Review.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ChatMessage, { foreignKey: "user_id", onDelete: "CASCADE" });
ChatMessage.belongsTo(User, { foreignKey: "user_id" });

User.hasMany(ChatMessage, { foreignKey: "admin_id", onDelete: "SET NULL", as: "adminChats" });
ChatMessage.belongsTo(User, { foreignKey: "admin_id", as: "admin" });

User.hasMany(UserOauth, { foreignKey: "user_id", as: "oauthProviders" });
UserOauth.belongsTo(User, { foreignKey: "user_id" });

const models = {
    sequelize,
    User,
    ChatMessage,
    Review,
    Wishlist,
    UserOauth
}

export default models;
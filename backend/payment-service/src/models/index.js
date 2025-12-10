import sequelize from "../configs/db.config.js";
import PaymentModel from "./payment.model.js";

const Payment = PaymentModel(sequelize);

const models = { sequelize, Payment};

export default models;
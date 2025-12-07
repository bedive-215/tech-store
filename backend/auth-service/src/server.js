import { app } from './app.js';   // app đã có express.json() trước route
import 'dotenv/config';
import sequelize from './configs/db.config.js';
import RabbitMQ from '../src/configs/rabbitmq.config.js';
import WishlistService from './services/wishlist.service.js';
import http from 'http';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync();
    console.log("Models synced");

    await RabbitMQ.connect();
    await WishlistService.initMessageHandlers();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
  }
};

startServer();

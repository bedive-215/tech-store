import { app } from './app.js';
import 'dotenv/config';
import sequelize from './configs/db.config.js';
// import RabbitMQ from './configs/rabbitmq.config.js';
import http from 'http';

const PORT = process.env.PORT;
const server = http.createServer(app);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync();
    console.log("Models synced");

    // await RabbitMQ.connect();
    // await cartService.initMessageHandlers();

    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed", error);
  }
};

startServer();

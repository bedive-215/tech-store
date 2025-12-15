import amqp from "amqplib";
import 'dotenv/config';

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    }

    async connect() {
        if (this.connection) return;

        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();

            console.log("RabbitMQ connected!");

            this.connection.on("close", () => {
                console.error("RabbitMQ disconnected. Reconnecting...");
                this.connection = null;
                this.channel = null;
                setTimeout(() => this.connect(), 3000);
            });

            this.connection.on("error", (err) => {
                console.error("RabbitMQ error:", err);
            });
        } catch (err) {
            console.error("Error connecting RabbitMQ. Retrying...");
            setTimeout(() => this.connect(), 3000);
        }
    }

    // Publish message
    async publish(routing_key, message) {
        if (!this.channel) await this.connect();
        const exchangeName = process.env.EXCHANGE_NAME;

        this.channel.publish(exchangeName, routing_key, Buffer.from(JSON.stringify(message)));
    }

    // Subscribe (Pub/Sub)
    async subscribe(queue_name, callback) {
        if (!this.channel) await this.connect();

        this.channel.consume(queue_name, (msg) => {
            if (msg) {
                try {
                    const data = JSON.parse(msg.content.toString());
                    callback(data, msg.fields.routingKey);
                    this.channel.ack(msg);
                } catch (err) {
                    console.error(err);
                    this.channel.nack(msg, false, false);
                }
            }
        },
            { noAck: false }
        );
    }
}

export default new RabbitMQ();

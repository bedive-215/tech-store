import amqp from "amqplib";

class RabbitMQ {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.url = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
    }

    // Kết nối tới RabbitMQ
    async connect() {
        if (this.connection) return;

        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();

            console.log("RabbitMQ connected");

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

    // Tạo Exchange (direct dùng cho Pub/Sub)
    async assertExchange(exchangeName) {
        await this.channel.assertExchange(exchangeName, "direct", {
            durable: true,
        });
    }

    // Publish message
    async publish(exchangeName, message) {
        if (!this.channel) await this.connect();

        await this.assertExchange(exchangeName);

        this.channel.publish(exchangeName, "", Buffer.from(JSON.stringify(message)));

        console.log(`Published to "${exchangeName}":`, message);
    }

    // Subscribe (Pub/Sub)
    async subscribe(exchangeName, callback) {
        if (!this.channel) await this.connect();

        await this.assertExchange(exchangeName);

        // Queue random kiểu pub/sub
        const q = await this.channel.assertQueue("", { exclusive: true });

        // Bind queue → exchange
        await this.channel.bindQueue(q.queue, exchangeName, "");

        console.log(`Subscribed to exchange "${exchangeName}" on queue "${q.queue}"`);

        this.channel.consume(
            q.queue,
            (msg) => {
                if (msg !== null) {
                    const content = JSON.parse(msg.content.toString());
                    callback(content);
                }
            },
            { noAck: true }
        );
    }
}

export default new RabbitMQ();

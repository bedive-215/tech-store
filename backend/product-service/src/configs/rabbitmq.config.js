import amqp from "amqplib";

class RabbitMQ {
    constructor() {
        this.conn = null;
        this.channel = null;

        this.exchange = process.env.EXCHANGE || "tech_store_exchange";
        this.exchangeType = "direct";

        this.queues = [
            { name: "rating_queue", routingKey: ["get.rating", "result.rating"] }
        ];
    }

    async connect() {
        if (this.channel) return this.channel;

        try {
            this.conn = await amqp.connect("amqp://guest:guest@rabbitmq:5672");
            this.channel = await this.conn.createChannel();

            // auto reconnect
            this.conn.on("close", () => {
                console.error("RabbitMQ connection closed. Reconnecting…");
                this.channel = null;
                setTimeout(() => this.connect(), 2000);
            });

            await this.channel.assertExchange(this.exchange, this.exchangeType, {
                durable: true
            });

            for (const q of this.queues) {
                await this.channel.assertQueue(q.name, { durable: true });

                for (const k of q.routingKey) {
                    await this.channel.bindQueue(q.name, this.exchange, k);
                }

                console.log(
                    `Queue created: ${q.name} → ${JSON.stringify(q.routingKey)}`
                );
            }

            console.log("RabbitMQ connected & queues initialized");
            return this.channel;

        } catch (err) {
            console.error("RabbitMQ connection error:", err.message);
            setTimeout(() => this.connect(), 2000);
        }
    }

    async publish(routingKey, message) {
        if (!this.channel) await this.connect();

        this.channel.publish(
            this.exchange,
            routingKey,
            Buffer.from(JSON.stringify(message)),
            { persistent: true }
        );

        console.log(`Message sent: ${routingKey}`);
    }

    async subscribe(queue, callback) {
        if (!this.channel) await this.connect();

        await this.channel.consume(
            queue,
            (msg) => {
                if (msg) {
                    const data = JSON.parse(msg.content.toString());
                    callback(data);
                    this.channel.ack(msg);
                }
            },
            { noAck: false }
        );

        console.log(`Listening queue: ${queue}`);
    }
}

export default new RabbitMQ();
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { Channel, Connection } from 'amqplib';
import { RMQ_QUEUES, RMQ_ROUTING_KEYS } from './rabbit.constants';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection!: Connection;
  private channel!: Channel;


  constructor(private readonly configService: ConfigService) { }

  async onModuleInit() {
    await this.connect();
    await this.setup();
  }

  private async connect(): Promise<void> {
    const rmqUrl = this.configService.get<string>('RABBITMQ_URL');
    if (!rmqUrl) {
      throw new Error('RABBITMQ_URL is not defined in environment variables');
    }

    const connection: Connection = await amqp.connect(rmqUrl);
    this.connection = connection;
    const channel: Channel = await this.connection.createChannel();
    this.channel = channel;

    console.log('Connected to RabbitMQ');
  }

  private async setup(): Promise<void> {
    const RMQ_EXCHANGE =
      this.configService.get<string>('EXCHANGE_NAME') ||
      'tech_store_exchange';

    await this.channel.assertExchange(RMQ_EXCHANGE, 'direct', { durable: true });

    const bindings = [
      { queue: RMQ_QUEUES.WISHLIST, key: RMQ_ROUTING_KEYS.WISHLIST },
      { queue: RMQ_QUEUES.PRODUCT, key: RMQ_ROUTING_KEYS.PRODUCT },
      { queue: RMQ_QUEUES.ORDER, key: RMQ_ROUTING_KEYS.ORDER },
      { queue: RMQ_QUEUES.PRODUCT_PRICE, key: RMQ_ROUTING_KEYS.PRODUCT_PRICE },
      { queue: RMQ_QUEUES.RESERVE_STOCK, key: RMQ_ROUTING_KEYS.RESERVE_STOCK },
      { queue: RMQ_QUEUES.PAYMENT, key: RMQ_ROUTING_KEYS.PAYMENT },
      { queue: RMQ_QUEUES.USER, key: RMQ_ROUTING_KEYS.USER },
      { queue: RMQ_QUEUES.WARRANTY, key: RMQ_ROUTING_KEYS.WARRANTY },
    ];

    for (const b of bindings) {
      await this.channel.assertQueue(b.queue, { durable: true });
      for (const key of b.key) {
        await this.channel.bindQueue(b.queue, RMQ_EXCHANGE, key);
        console.log(`Queue "${b.queue}" bound to "${key}"`);
      }
    }
    console.log('All queues and routing key have been setup successfully!');
  }

  getChannel(): amqp.Channel {
    return this.channel;
  }
}
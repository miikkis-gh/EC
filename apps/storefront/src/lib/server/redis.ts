import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

let client: Redis | null = null;
let connectionFailed = false;
let failedAt = 0;
const RECONNECT_COOLDOWN_MS = 30_000;

function createRedisClient(): Redis | null {
	const url = process.env.REDIS_URL;
	if (!url) {
		logger.info('REDIS_URL not set — using in-memory fallbacks');
		return null;
	}

	const redis = new Redis(url, {
		lazyConnect: true,
		maxRetriesPerRequest: null,
		retryStrategy(times) {
			if (times > 10) {
				logger.error('Redis retry limit reached, giving up');
				connectionFailed = true;
				failedAt = Date.now();
				return null;
			}
			const delay = Math.min(times * 200, 5000);
			return delay;
		}
	});

	redis.on('connect', () => {
		connectionFailed = false;
		logger.info('Redis connected');
	});

	redis.on('error', (err) => {
		logger.error('Redis error', err);
	});

	redis.on('close', () => {
		logger.warn('Redis connection closed');
	});

	redis.connect().catch((err) => {
		connectionFailed = true;
		failedAt = Date.now();
		logger.error('Redis initial connection failed', err);
	});

	return redis;
}

export function getRedisClient(): Redis | null {
	if (connectionFailed) {
		if (Date.now() - failedAt < RECONNECT_COOLDOWN_MS) return null;
		// Cooldown elapsed — attempt fresh connection
		logger.info('Redis reconnect cooldown elapsed, attempting fresh connection');
		connectionFailed = false;
		if (client) {
			client.disconnect();
			client = null;
		}
	}
	if (!client) {
		client = createRedisClient();
	}
	return client;
}

import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Initialize Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Initialize embedding queue
const embeddingQueue = new Queue('embedding', {
  connection: redis
});

interface EmbeddingJobData {
  docId: string;
  orgId: string;
  filePath: string;
}

export async function enqueueEmbeddingJob(data: EmbeddingJobData) {
  return embeddingQueue.add('process_document', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  });
} 
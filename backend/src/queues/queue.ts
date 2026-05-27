import { Queue, QueueEvents } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

let isRedisConnected = false;
let redisConnection: IORedis | null = null;
let assessmentQueue: any = null;

// Mock queue interface for in-memory processing
class InMemoryQueue {
  private jobs: Array<{ id: string; name: string; data: any }> = [];
  private worker: ((job: any) => Promise<void>) | null = null;
  private isProcessing = false;

  async add(name: string, data: any) {
    const id = Math.random().toString(36).substring(2, 9);
    const job = { id, name, data };
    this.jobs.push(job);
    console.log(`[InMemoryQueue] Added job ${id} - "${name}"`);
    
    // Process asynchronously in background
    setTimeout(() => this.processNext(), 100);
    return { id };
  }

  setWorker(workerFn: (job: any) => Promise<void>) {
    this.worker = workerFn;
  }

  private async processNext() {
    if (this.isProcessing || this.jobs.length === 0 || !this.worker) return;
    this.isProcessing = true;
    
    const job = this.jobs.shift();
    if (job) {
      console.log(`[InMemoryQueue] Processing job ${job.id}`);
      try {
        await this.worker(job);
        console.log(`[InMemoryQueue] Completed job ${job.id}`);
      } catch (err: any) {
        console.error(`[InMemoryQueue] Error processing job ${job.id}:`, err.message);
      }
    }
    
    this.isProcessing = false;
    this.processNext();
  }
}

const localQueue = new InMemoryQueue();

export async function initRedisAndQueue() {
  const host = process.env.REDIS_HOST || "127.0.0.1";
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);
  
  console.log(`Connecting to Redis at: ${host}:${port}...`);
  
  return new Promise<void>((resolve) => {
    redisConnection = new IORedis({
      host,
      port,
      maxRetriesPerRequest: 1, // fail quickly
      connectTimeout: 3000,
      lazyConnect: true
    });

    redisConnection.connect().then(() => {
      isRedisConnected = true;
      console.log("🟢 Successfully connected to Redis.");
      
      // Create BullMQ Queue
      assessmentQueue = new Queue("assessment-generation", {
        connection: redisConnection! as any
      });
      resolve();
    }).catch((err) => {
      isRedisConnected = false;
      console.warn("⚠️ Failed to connect to Redis. Error:", err.message);
      console.warn("🟡 Falling back to In-Memory Event Loop Queue. BullMQ background tasks will run in-process.");
      resolve();
    });
  });
}

export function isRedisActive() {
  return isRedisConnected;
}

export function getRedisConnection() {
  return redisConnection;
}

export async function addJobToQueue(name: string, data: any) {
  if (isRedisConnected && assessmentQueue) {
    try {
      const job = await assessmentQueue.add(name, data, {
        attempts: 2,
        backoff: 5000
      });
      return job.id;
    } catch (err) {
      console.error("BullMQ add queue failed, falling back to memory queue", err);
    }
  }
  
  const job = await localQueue.add(name, data);
  return job.id;
}

export function registerWorkerHandler(workerFn: (job: any) => Promise<void>) {
  localQueue.setWorker(workerFn);
}

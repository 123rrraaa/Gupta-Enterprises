const API_ORDERS = "http://localhost:5000/orders";

const QUEUE_KEY = 'water-orders-sync-queue';

type Order = any;

const readQueue = (): Order[] => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY) || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read sync queue', e);
    return [];
  }
};

const writeQueue = (queue: Order[]) => {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Failed to write sync queue', e);
  }
};

export const enqueueOrder = (order: Order) => {
  const q = readQueue();
  q.push(order);
  writeQueue(q);
};

const sendOrder = async (order: Order) => {
  const res = await fetch(API_ORDERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to POST order: ${res.status} ${text}`);
  }

  return res.json();
};

export const processQueue = async () => {
  const queue = readQueue();
  if (!queue.length) return;

  const remaining: Order[] = [];

  for (const order of queue) {
    try {
      await sendOrder(order);
      console.log('Order synced to backend:', order.id || order.id);
    } catch (err) {
      console.error('Failed to sync order, will retry later:', err);
      remaining.push(order);
    }
  }

  writeQueue(remaining);
};

let intervalId: number | null = null;

export const startOrderSync = (opts?: { intervalMs?: number }) => {
  const intervalMs = opts?.intervalMs ?? 10000; // 10s default
  // run immediately, then start interval
  processQueue().catch(err => console.error(err));
  if (intervalId) return; // already started
  intervalId = window.setInterval(() => {
    processQueue().catch(err => console.error(err));
  }, intervalMs);
};

export const stopOrderSync = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export default {
  enqueueOrder,
  processQueue,
  startOrderSync,
  stopOrderSync,
};

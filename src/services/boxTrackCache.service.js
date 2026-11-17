/**
 * BoxTrack Offline Cache & Sincronizacion Local
 * Regla Inquebrantable #14: Invariante Anti-Siembras Fantasma
 */
const PURGE_FLAG = 'boxtrack_demo_purged';
const STORAGE_KEY_ORDERS = 'boxtrack_orders_v1';
const STORAGE_KEY_DAMAGES = 'boxtrack_damages_v1';
const STORAGE_KEY_CONTRACTS = 'boxtrack_contracts_v1';
const STORAGE_KEY_OUTBOX = 'boxtrack_outbox_v1';

const memoryStore = new Map();

function getStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key, val) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStore.set(key, val);
  }
}

function removeStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

function safeJsonParse(raw, fallback = []) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export class BoxTrackCacheService {
  static isPurged() {
    return getStorageItem(PURGE_FLAG) === 'true';
  }

  static purgeData() {
    setStorageItem(PURGE_FLAG, 'true');
    removeStorageItem(STORAGE_KEY_ORDERS);
    removeStorageItem(STORAGE_KEY_DAMAGES);
    removeStorageItem(STORAGE_KEY_CONTRACTS);
    removeStorageItem(STORAGE_KEY_OUTBOX);
  }

  static resetPurgeForTesting() {
    removeStorageItem(PURGE_FLAG);
  }

  isPurged() {
    return BoxTrackCacheService.isPurged();
  }

  purgeData() {
    return BoxTrackCacheService.purgeData();
  }

  static saveOrders(orders = []) {
    setStorageItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }

  static getOrders() {
    if (this.isPurged()) return [];
    return safeJsonParse(getStorageItem(STORAGE_KEY_ORDERS), []);
  }

  static saveDamages(damages = []) {
    setStorageItem(STORAGE_KEY_DAMAGES, JSON.stringify(damages));
  }

  static getDamages() {
    if (this.isPurged()) return [];
    return safeJsonParse(getStorageItem(STORAGE_KEY_DAMAGES), []);
  }

  static saveContracts(contracts = []) {
    setStorageItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
  }

  static getContracts() {
    if (this.isPurged()) return [];
    return safeJsonParse(getStorageItem(STORAGE_KEY_CONTRACTS), []);
  }

  static enqueueOutbox(action) {
    const queue = this.getOutbox();
    queue.push({
      id: `OUT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      enqueuedAt: new Date().toISOString()
    });
    setStorageItem(STORAGE_KEY_OUTBOX, JSON.stringify(queue));
  }

  static getOutbox() {
    return safeJsonParse(getStorageItem(STORAGE_KEY_OUTBOX), []);
  }

  static clearOutbox() {
    removeStorageItem(STORAGE_KEY_OUTBOX);
  }
}

import { SaveService } from './SaveService.js';

export class LocalSaveService extends SaveService {
  constructor({ storage = globalThis.localStorage, key = 'audi_game_save_slots' } = {}) {
    super();
    this.storage = storage;
    this.key = key;
  }

  readAll() {
    try {
      const raw = this.storage?.getItem(this.key);
      return raw ? JSON.parse(raw) : { slots: {} };
    } catch {
      return { slots: {} };
    }
  }

  async list() {
    return Object.entries(this.readAll().slots || {}).map(([slotId, saveData]) => ({ slotId, saveData }));
  }

  async load(slotId) {
    return this.readAll().slots?.[slotId] || null;
  }

  async write(slotId, saveData) {
    const allSlots = this.readAll();
    allSlots.slots = allSlots.slots || {};
    allSlots.slots[slotId] = saveData;
    this.storage?.setItem(this.key, JSON.stringify(allSlots));
    return saveData;
  }

  async delete(slotId) {
    const allSlots = this.readAll();
    if (allSlots.slots) delete allSlots.slots[slotId];
    this.storage?.setItem(this.key, JSON.stringify(allSlots));
  }
}

import { createStore } from './store.js';

export const STORE_EVENT = 'oud-aura:changed';
const storage = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

export const store = createStore(storage, {
  lock: navigator.locks ? (run) => navigator.locks.request('oud-aura:write', run) : null,
  notify: () => window.dispatchEvent(new Event(STORE_EVENT)),
});

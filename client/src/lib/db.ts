import { openDB } from 'idb';

const DB_NAME = 'zepto-split-db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('people')) {
                db.createObjectStore('people', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('receipts')) {
                db.createObjectStore('receipts', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('splits')) {
                db.createObjectStore('splits', { keyPath: 'itemId' });
            }
        },
    });
};

export const dbPromise = initDB();

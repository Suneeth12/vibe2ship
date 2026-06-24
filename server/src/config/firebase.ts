import * as admin from 'firebase-admin';
import { env } from './env';
import { MockFirestore } from './mockDb';

try {
  let credentialJson;
  try {
    const fsLib = require('fs');
    const pathLib = require('path');
    
    // Check if it's a file path
    const resolvedPath = pathLib.resolve(env.FIREBASE_SERVICE_ACCOUNT.replace(/^['"]|['"]$/g, '')); // strip quotes
    if (fsLib.existsSync(resolvedPath)) {
      credentialJson = JSON.parse(fsLib.readFileSync(resolvedPath, 'utf8'));
    } else {
      credentialJson = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
    }
  } catch (err) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string or a valid path to a service account JSON file.');
  }

  admin.initializeApp({
    credential: admin.credential.cert(credentialJson),
    storageBucket: `${credentialJson.project_id}.appspot.com` // Auto-derive storage bucket
  });

  console.log('✔ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

// Dynamic Database Wrapper that switches to mock if real operations fail
class DynamicFirestore {
  private realDb: any;
  private mockDb: MockFirestore | null = null;
  private isFallback = false;

  constructor() {
    try {
      this.realDb = admin.firestore();
    } catch (err) {
      console.warn('⚠️ Firestore initialization failed, using mock database.');
      this.isFallback = true;
      this.mockDb = new MockFirestore();
    }
  }

  private getDb() {
    if (this.isFallback) {
      if (!this.mockDb) this.mockDb = new MockFirestore();
      return this.mockDb;
    }
    return this.realDb;
  }

  private switchToMock() {
    if (!this.isFallback) {
      console.warn('⚠️ Cloud Firestore API is disabled or inaccessible. Falling back to Local Mock Database.');
      this.isFallback = true;
      this.mockDb = new MockFirestore();
    }
  }

  private async executeWithFallback<T>(operation: (db: any) => Promise<T>): Promise<T> {
    try {
      return await operation(this.getDb());
    } catch (err: any) {
      if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
        this.switchToMock();
        return await operation(this.getDb());
      }
      throw err;
    }
  }

  collection(name: string) {
    const self = this;
    const queryBuilder = (queryChain: any[]) => {
      const builder: any = {
        where(f: string, o: string, v: any) { return queryBuilder([...queryChain, ['where', [f, o, v]]]); },
        orderBy(f: string, d?: string) { return queryBuilder([...queryChain, ['orderBy', [f, d]]]); },
        limit(n: number) { return queryBuilder([...queryChain, ['limit', [n]]]); },
        async get() {
          return self.executeWithFallback(async (db) => {
            let q = db.collection(name);
            for (const step of queryChain) {
              q = q[step[0]](...step[1]);
            }
            return await q.get();
          });
        }
      };
      return builder;
    };

    return {
      doc(id?: string) {
        return {
          async get() { return self.executeWithFallback(db => db.collection(name).doc(id).get()); },
          async set(data: any, options?: any) { return self.executeWithFallback(db => db.collection(name).doc(id).set(data, options)); },
          async update(data: any) { return self.executeWithFallback(db => db.collection(name).doc(id).update(data)); },
          async delete() { return self.executeWithFallback(db => db.collection(name).doc(id).delete()); }
        };
      },
      where(field: string, op: string, val: any) { return queryBuilder([['where', [field, op, val]]]); },
      orderBy(field: string, dir?: string) { return queryBuilder([['orderBy', [field, dir]]]); },
      limit(n: number) { return queryBuilder([['limit', [n]]]); },
      async get() { return self.executeWithFallback(db => db.collection(name).get()); }
    };
  }

  async runTransaction(cb: any) {
    return this.executeWithFallback(db => db.runTransaction(cb));
  }
}

export const db = new DynamicFirestore() as any;
export const auth = admin.auth();
export const storage = admin.storage();
export const adminRef = admin;
export default admin;

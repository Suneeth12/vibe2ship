import * as admin from 'firebase-admin';
import { env } from './env';
import { MockFirestore } from './mockDb';
import fs from 'fs';
import path from 'path';

let credential: admin.credential.Credential;
let projectId: string | undefined;

const serviceAccountVal = env.FIREBASE_SERVICE_ACCOUNT.trim();
const cleanedVal = serviceAccountVal.replace(/^['"]|['"]$/g, '').trim();

if (cleanedVal === 'ADC') {
  credential = admin.credential.applicationDefault();
  projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
} else {
  let parsedCert: any = null;
  try {
    parsedCert = JSON.parse(cleanedVal);
  } catch (jsonErr) {
    try {
      const resolvedPath = path.resolve(cleanedVal);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        parsedCert = JSON.parse(fileContent);
      }
    } catch (pathErr) {
      // Fall through to error below
    }
  }

  if (parsedCert) {
    credential = admin.credential.cert(parsedCert);
    projectId = parsedCert.project_id;
  } else {
    throw new Error(`Failed to resolve FIREBASE_SERVICE_ACCOUNT. Must be 'ADC', valid inline JSON, or a valid file path. Value was: ${serviceAccountVal}`);
  }
}

let storageBucket: string;
if (env.FIREBASE_STORAGE_BUCKET) {
  storageBucket = env.FIREBASE_STORAGE_BUCKET;
} else if (projectId) {
  storageBucket = `${projectId}.appspot.com`;
} else {
  throw new Error('Cannot determine Firebase Storage Bucket: neither FIREBASE_STORAGE_BUCKET nor project ID is available.');
}

try {
  admin.initializeApp({
    credential,
    storageBucket,
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
      if (env.NODE_ENV === 'production') {
        console.error('❌ Firestore initialization failed in production:', err);
        throw err;
      }
      console.warn('⚠️ Firestore initialization failed, using mock database.');
      this.isFallback = true;
      this.mockDb = new MockFirestore();
    }
  }

  private getDb() {
    if (this.isFallback) {
      if (env.NODE_ENV === 'production') {
        throw new Error('Mock database fallback is disabled in production.');
      }
      if (!this.mockDb) this.mockDb = new MockFirestore();
      return this.mockDb;
    }
    return this.realDb;
  }

  private switchToMock() {
    if (env.NODE_ENV === 'production') {
      throw new Error('Mock database fallback is disabled in production.');
    }
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
      const isKnownFallback = err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7);
      // In development, also fall back for credential/token failures (e.g. local dummy service account).
      if ((isKnownFallback || env.NODE_ENV !== 'production') && !this.isFallback) {
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
        const docId = id || (self.isFallback ? 
          Math.random().toString(36).substring(2, 15) : 
          self.realDb.collection(name).doc().id);

        return {
          id: docId,
          async get() { return self.executeWithFallback(db => db.collection(name).doc(docId).get()); },
          async set(data: any, options?: any) { return self.executeWithFallback(db => db.collection(name).doc(docId).set(data, options)); },
          async update(data: any) { return self.executeWithFallback(db => db.collection(name).doc(docId).update(data)); },
          async delete() { return self.executeWithFallback(db => db.collection(name).doc(docId).delete()); }
        };
      },
      async add(data: any) {
        return self.executeWithFallback(async (db) => {
          if (self.isFallback) {
            return await db.collection(name).add(data);
          } else {
            const docRef = await db.collection(name).add(data);
            return {
              id: docRef.id,
              async get() { return self.executeWithFallback(db => db.collection(name).doc(docRef.id).get()); },
              async set(data: any, options?: any) { return self.executeWithFallback(db => db.collection(name).doc(docRef.id).set(data, options)); },
              async update(data: any) { return self.executeWithFallback(db => db.collection(name).doc(docRef.id).update(data)); },
              async delete() { return self.executeWithFallback(db => db.collection(name).doc(docRef.id).delete()); }
            };
          }
        });
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

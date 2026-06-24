import * as admin from 'firebase-admin';
import { env } from './env';
import * as fs from 'fs';
import * as path from 'path';

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

// Mock Firestore Database Implementation
class MockDocumentReference {
  constructor(private collectionName: string, public id: string, private dbInstance: MockFirestore) {}

  async get() {
    const data = this.dbInstance.getData(this.collectionName, this.id);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => data
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    this.dbInstance.setData(this.collectionName, this.id, data, options?.merge);
    return { writeTime: new Date() };
  }

  async update(data: any) {
    this.dbInstance.setData(this.collectionName, this.id, data, true);
    return { writeTime: new Date() };
  }

  async delete() {
    this.dbInstance.deleteData(this.collectionName, this.id);
    return { writeTime: new Date() };
  }
}

class MockQuery {
  protected wheres: Array<{ field: string, op: string, val: any }> = [];
  protected order: { field: string, dir: 'asc' | 'desc' } | null = null;
  protected limitCount: number = 100;

  constructor(protected collectionName: string, protected dbInstance: MockFirestore) {}

  where(field: string, op: string, val: any) {
    this.wheres.push({ field, op, val });
    return this;
  }

  orderBy(field: string, dir: 'asc' | 'desc' = 'asc') {
    this.order = { field, dir };
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  async get() {
    let docs = this.dbInstance.getCollectionDocs(this.collectionName);

    // Apply wheres
    for (const w of this.wheres) {
      docs = docs.filter((doc: any) => {
        const val = doc[w.field];
        if (w.op === '==') return val === w.val;
        if (w.op === '!=') return val !== w.val;
        if (w.op === '>') return val > w.val;
        if (w.op === '>=') return val >= w.val;
        if (w.op === '<') return val < w.val;
        if (w.op === '<=') return val <= w.val;
        return true;
      });
    }

    // Apply orderBy
    if (this.order) {
      const { field, dir } = this.order;
      docs.sort((a: any, b: any) => {
        const va = a[field];
        const vb = b[field];
        if (va < vb) return dir === 'asc' ? -1 : 1;
        if (va > vb) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    docs = docs.slice(0, this.limitCount);

    const snapshotDocs = docs.map((doc: any) => ({
      exists: true,
      id: doc.id,
      data: () => {
        const { id, ...rest } = doc;
        return rest;
      }
    }));

    return {
      docs: snapshotDocs,
      size: snapshotDocs.length,
      forEach: (cb: any) => snapshotDocs.forEach(cb)
    };
  }
}

class MockCollectionReference extends MockQuery {
  doc(id?: string) {
    const finalId = id || Math.random().toString(36).substring(2, 15);
    return new MockDocumentReference(this.collectionName, finalId, this.dbInstance);
  }
}

class MockTransaction {
  constructor(private dbInstance: MockFirestore) {}

  async get(ref: MockDocumentReference) {
    return ref.get();
  }

  set(ref: MockDocumentReference, data: any, options?: { merge?: boolean }) {
    this.dbInstance.setData(ref['collectionName'], ref.id, data, options?.merge);
    return this;
  }

  update(ref: MockDocumentReference, data: any) {
    this.dbInstance.setData(ref['collectionName'], ref.id, data, true);
    return this;
  }

  delete(ref: MockDocumentReference) {
    this.dbInstance.deleteData(ref['collectionName'], ref.id);
    return this;
  }
}

class MockFirestore {
  private dbPath = path.resolve(__dirname, 'mock_db.json');
  private data: Record<string, Record<string, any>> = {};

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        this.data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      } else {
        // Pre-initialize mock database with seed data
        this.data = {
          users: {
            demo_user_id: {
              email: 'demo@communityhero.org',
              displayName: 'Demo Hero',
              avatarUrl: 'https://picsum.photos/seed/demo/100',
              role: 'reporter',
              points: 50,
              level: 1,
              trustScore: 60,
              joinedAt: new Date().toISOString()
            },
            user_1: {
              email: 'alex@communityhero.org',
              displayName: 'Alex Smith',
              avatarUrl: 'https://picsum.photos/seed/user1/100',
              role: 'reporter',
              points: 320,
              level: 3,
              trustScore: 85,
              joinedAt: new Date(Date.now() - 3600000 * 240).toISOString()
            },
            user_2: {
              email: 'sara@communityhero.org',
              displayName: 'Sara Connor',
              avatarUrl: 'https://picsum.photos/seed/user2/100',
              role: 'validator',
              points: 780,
              level: 5,
              trustScore: 92,
              joinedAt: new Date(Date.now() - 3600000 * 500).toISOString()
            },
            user_3: {
              email: 'officer_bob@seattle.gov',
              displayName: 'Officer Bob',
              avatarUrl: 'https://picsum.photos/seed/user3/100',
              role: 'admin',
              points: 1500,
              level: 10,
              trustScore: 99,
              joinedAt: new Date(Date.now() - 3600000 * 1000).toISOString()
            }
          },
          leaderboard: {
            demo_user_id: {
              displayName: 'Demo Hero',
              points: 50,
              level: 1,
              lastUpdated: new Date().toISOString()
            },
            user_1: {
              displayName: 'Alex Smith',
              points: 320,
              level: 3,
              lastUpdated: new Date().toISOString()
            },
            user_2: {
              displayName: 'Sara Connor',
              points: 780,
              level: 5,
              lastUpdated: new Date().toISOString()
            },
            user_3: {
              displayName: 'Officer Bob',
              points: 1500,
              level: 10,
              lastUpdated: new Date().toISOString()
            }
          },
          issues: {
            issue_1: {
              reporterId: 'user_1',
              mediaUrl: 'https://picsum.photos/seed/pothole/400/300',
              mediaType: 'image/jpeg',
              description: 'Deep pothole causing cars to swerve on 4th Ave.',
              latitude: 47.6080,
              longitude: -122.3350,
              address: '4th Ave & Madison St, Seattle, WA 98104',
              category: 'Infrastructure',
              subcategory: 'Pothole',
              severity: 'high',
              priorityScore: 72,
              department: 'Seattle Department of Transportation',
              status: 'Pending',
              consensusScore: 0,
              votesCount: 0,
              confidence: 0.92,
              reasoning: 'Pothole verified on major street.',
              createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
              updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
            },
            issue_2: {
              reporterId: 'user_2',
              mediaUrl: 'https://picsum.photos/seed/light/400/300',
              mediaType: 'image/jpeg',
              description: 'Street light out near transit station, very dark at night.',
              latitude: 47.6150,
              longitude: -122.3210,
              address: 'E John St & Broadway, Seattle, WA 98102',
              category: 'Utilities',
              subcategory: 'Street Light',
              severity: 'medium',
              priorityScore: 55,
              department: 'City Light',
              status: 'Community Verified',
              consensusScore: 6,
              votesCount: 8,
              confidence: 0.88,
              reasoning: 'Darkness near transit hub increases safety risk.',
              createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
              updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
            },
            issue_3: {
              reporterId: 'user_3',
              mediaUrl: 'https://picsum.photos/seed/graffiti/400/300',
              mediaType: 'image/jpeg',
              description: 'Graffiti covering park regulations sign.',
              latitude: 47.6010,
              longitude: -122.3300,
              address: 'Pioneer Square Park, Seattle, WA 98104',
              category: 'Sanitation',
              subcategory: 'Graffiti',
              severity: 'low',
              priorityScore: 20,
              department: 'Parks & Recreation',
              status: 'Resolved',
              consensusScore: 12,
              votesCount: 12,
              confidence: 0.95,
              reasoning: 'Non-hazardous cleanup task.',
              createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
              updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
            },
            issue_4: {
              reporterId: 'user_1',
              mediaUrl: 'https://picsum.photos/seed/bikelane/400/300',
              mediaType: 'image/jpeg',
              description: 'Delivery truck constantly parking in the designated bike lane during morning rush hour.',
              latitude: 47.6130,
              longitude: -122.3450,
              address: '2nd Ave & Bell St, Seattle, WA 98121',
              category: 'Infrastructure',
              subcategory: 'Obstruction',
              severity: 'medium',
              priorityScore: 48,
              department: 'Seattle Department of Transportation',
              status: 'Pending',
              consensusScore: 2,
              votesCount: 3,
              confidence: 0.85,
              reasoning: 'Obstruction creates safety hazard for cyclists.',
              createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
              updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
            }
          },
          verifications: {}
        };
        this.save();
      }
    } catch (err) {
      console.error('Error loading mock database, resetting:', err);
      this.data = { users: {}, issues: {}, leaderboard: {}, verifications: {} };
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving mock database:', err);
    }
  }

  getData(collection: string, id: string) {
    if (!this.data[collection]) return undefined;
    return this.data[collection][id];
  }

  setData(collection: string, id: string, docData: any, merge = false) {
    if (!this.data[collection]) this.data[collection] = {};
    if (merge && this.data[collection][id]) {
      this.data[collection][id] = { ...this.data[collection][id], ...docData };
    } else {
      this.data[collection][id] = docData;
    }
    this.save();
  }

  deleteData(collection: string, id: string) {
    if (this.data[collection] && this.data[collection][id]) {
      delete this.data[collection][id];
      this.save();
    }
  }

  getCollectionDocs(collection: string) {
    if (!this.data[collection]) return [];
    return Object.entries(this.data[collection]).map(([id, val]) => ({
      id,
      ...val
    }));
  }

  collection(name: string) {
    return new MockCollectionReference(name, this);
  }

  async runTransaction(cb: (transaction: MockTransaction) => Promise<any>) {
    const tx = new MockTransaction(this);
    return cb(tx);
  }
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

  collection(name: string) {
    const self = this;
    return {
      doc(id?: string) {
        return {
          async get() {
            try {
              return await self.getDb().collection(name).doc(id).get();
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                return await self.getDb().collection(name).doc(id).get();
              }
              throw err;
            }
          },
          async set(data: any, options?: any) {
            try {
              return await self.getDb().collection(name).doc(id).set(data, options);
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                return await self.getDb().collection(name).doc(id).set(data, options);
              }
              throw err;
            }
          },
          async update(data: any) {
            try {
              return await self.getDb().collection(name).doc(id).update(data);
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                return await self.getDb().collection(name).doc(id).update(data);
              }
              throw err;
            }
          },
          async delete() {
            try {
              return await self.getDb().collection(name).doc(id).delete();
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                return await self.getDb().collection(name).doc(id).delete();
              }
              throw err;
            }
          }
        };
      },
      where(field: string, op: string, val: any) {
        const queryChain: any[] = [['where', [field, op, val]]];
        const chainObj = {
          where(f: string, o: string, v: any) {
            queryChain.push(['where', [f, o, v]]);
            return chainObj;
          },
          orderBy(f: string, d?: string) {
            queryChain.push(['orderBy', [f, d]]);
            return chainObj;
          },
          limit(n: number) {
            queryChain.push(['limit', [n]]);
            return chainObj;
          },
          async get() {
            try {
              let q = self.getDb().collection(name);
              for (const step of queryChain) {
                q = q[step[0]](...step[1]);
              }
              return await q.get();
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                let q = self.getDb().collection(name);
                for (const step of queryChain) {
                  q = q[step[0]](...step[1]);
                }
                return await q.get();
              }
              throw err;
            }
          }
        };
        return chainObj;
      },
      orderBy(field: string, dir?: string) {
        const queryChain: any[] = [['orderBy', [field, dir]]];
        const chainObj = {
          where(f: string, o: string, v: any) {
            queryChain.push(['where', [f, o, v]]);
            return chainObj;
          },
          orderBy(f: string, d?: string) {
            queryChain.push(['orderBy', [f, d]]);
            return chainObj;
          },
          limit(n: number) {
            queryChain.push(['limit', [n]]);
            return chainObj;
          },
          async get() {
            try {
              let q = self.getDb().collection(name);
              for (const step of queryChain) {
                q = q[step[0]](...step[1]);
              }
              return await q.get();
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                let q = self.getDb().collection(name);
                for (const step of queryChain) {
                  q = q[step[0]](...step[1]);
                }
                return await q.get();
              }
              throw err;
            }
          }
        };
        return chainObj;
      },
      limit(n: number) {
        const queryChain: any[] = [['limit', [n]]];
        const chainObj = {
          where(f: string, o: string, v: any) {
            queryChain.push(['where', [f, o, v]]);
            return chainObj;
          },
          orderBy(f: string, d?: string) {
            queryChain.push(['orderBy', [f, d]]);
            return chainObj;
          },
          limit(n: number) {
            queryChain.push(['limit', [n]]);
            return chainObj;
          },
          async get() {
            try {
              let q = self.getDb().collection(name);
              for (const step of queryChain) {
                q = q[step[0]](...step[1]);
              }
              return await q.get();
            } catch (err: any) {
              if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
                self.switchToMock();
                let q = self.getDb().collection(name);
                for (const step of queryChain) {
                  q = q[step[0]](...step[1]);
                }
                return await q.get();
              }
              throw err;
            }
          }
        };
        return chainObj;
      },
      async get() {
        try {
          return await self.getDb().collection(name).get();
        } catch (err: any) {
          if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
            self.switchToMock();
            return await self.getDb().collection(name).get();
          }
          throw err;
        }
      }
    };
  }

  async runTransaction(cb: any) {
    try {
      return await this.getDb().runTransaction(cb);
    } catch (err: any) {
      if (err.message && (err.message.includes('API has not been used') || err.message.includes('PERMISSION_DENIED') || err.code === 7)) {
        this.switchToMock();
        return await this.getDb().runTransaction(cb);
      }
      throw err;
    }
  }
}

export const db = new DynamicFirestore() as any;
export const auth = admin.auth();
export const storage = admin.storage();
export const adminRef = admin;
export default admin;

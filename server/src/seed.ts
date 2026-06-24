import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

const firebaseServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT || '';

if (!firebaseServiceAccount) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable is not defined.');
  process.exit(1);
}

try {
  let credentialJson;
  const resolvedPath = path.resolve(firebaseServiceAccount.replace(/^['"]|['"]$/g, ''));
  if (fs.existsSync(resolvedPath)) {
    credentialJson = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } else {
    credentialJson = JSON.parse(firebaseServiceAccount);
  }

  admin.initializeApp({
    credential: admin.credential.cert(credentialJson)
  });

  console.log('✔ Firebase Admin SDK initialized successfully for seeding');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

const db = admin.firestore();

const issues = [
  {
    id: 'issue_1',
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
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'issue_2',
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
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 24 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'issue_3',
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
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 48 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString()
  },
  {
    id: 'issue_4',
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
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

const users = [
  {
    id: 'demo_user_id',
    email: 'demo@communityhero.org',
    displayName: 'Demo Hero',
    avatarUrl: 'https://picsum.photos/seed/demo/100',
    role: 'reporter',
    points: 50,
    level: 1,
    trustScore: 60,
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_1',
    email: 'alex@communityhero.org',
    displayName: 'Alex Smith',
    avatarUrl: 'https://picsum.photos/seed/user1/100',
    role: 'reporter',
    points: 320,
    level: 3,
    trustScore: 85,
    joinedAt: new Date(Date.now() - 3600000 * 240).toISOString()
  },
  {
    id: 'user_2',
    email: 'sara@communityhero.org',
    displayName: 'Sara Connor',
    avatarUrl: 'https://picsum.photos/seed/user2/100',
    role: 'validator',
    points: 780,
    level: 5,
    trustScore: 92,
    joinedAt: new Date(Date.now() - 3600000 * 500).toISOString()
  },
  {
    id: 'user_3',
    email: 'officer_bob@seattle.gov',
    displayName: 'Officer Bob',
    avatarUrl: 'https://picsum.photos/seed/user3/100',
    role: 'admin',
    points: 1500,
    level: 10,
    trustScore: 99,
    joinedAt: new Date(Date.now() - 3600000 * 1000).toISOString()
  }
];

async function seed() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed users
  for (const user of users) {
    const { id, ...data } = user;
    await db.collection('users').doc(id).set(data);
    console.log(`👤 Seeded user: ${user.displayName}`);

    // Seed leaderboard document matching user
    await db.collection('leaderboard').doc(id).set({
      displayName: user.displayName,
      points: user.points,
      level: user.level,
      lastUpdated: new Date().toISOString()
    });
    console.log(`🏆 Seeded leaderboard score for: ${user.displayName}`);
  }

  // 2. Seed issues
  for (const issue of issues) {
    const { id, ...data } = issue;
    await db.collection('issues').doc(id).set(data);
    console.log(`📍 Seeded issue: ${issue.description}`);
  }

  console.log('✅ Database seeding completed successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

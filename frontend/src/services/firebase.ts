import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { config } from '@/services/config';

/**
 * Firebase bootstrap — Cloud Firestore adapter.
 *
 * When Firebase credentials are present in `frontend/.env`, the app writes
 * snapshots to Firestore. Without credentials, the local localStorage adapter
 * is used automatically (see db.ts).
 */

export const firebaseEnabled = config.firebaseEnabled;

export const firebaseApp: FirebaseApp | null = firebaseEnabled
  ? initializeApp(config.firebase)
  : null;

export const firebaseDb: Firestore | null = firebaseEnabled && firebaseApp
  ? getFirestore(firebaseApp)
  : null;
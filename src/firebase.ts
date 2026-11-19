import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  browserPopupRedirectResolver,
  browserSessionPersistence,
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  initializeFirestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

type ExtendedFirestoreSettings = FirestoreSettings & {
  useFetchStreams?: boolean;
};

const app = initializeApp(firebaseConfig);

const firestoreSettings: ExtendedFirestoreSettings =
  typeof window !== 'undefined'
    ? {
        useFetchStreams: true,
        experimentalForceLongPolling: true,
        experimentalLongPollingOptions: {
          timeoutSeconds: 8,
        },
      }
    : {};

export const db = initializeFirestore(
  app,
  firestoreSettings,
  firebaseConfig.firestoreDatabaseId
);

export const auth =
  typeof window !== 'undefined'
    ? initializeAuth(app, {
        persistence: [
          indexedDBLocalPersistence,
          browserLocalPersistence,
          browserSessionPersistence,
        ],
      })
    : getAuth(app);

export const popupRedirectResolver = browserPopupRedirectResolver;
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'moneda1solperu@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    if (typeof auth.authStateReady === 'function') {
      await auth.authStateReady();
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Verifique la configuración de Firebase.');
    }
  }
}

void testConnection();

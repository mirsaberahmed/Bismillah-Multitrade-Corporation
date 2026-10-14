import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const ORG_KEY = 'BISMILLAH-MULTITRADE-CORP';

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

// Validate connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export interface ErpAuthAccount {
  orgKey: string;
  accountId: string;
  username: string;
  pin: string;
  displayName: string;
  role: string;
  fingerprintEnabled: boolean;
  credentialId: string;
  updatedAtIso: string;
}

export const DEFAULT_AUTH_ACCOUNT: ErpAuthAccount = {
  orgKey: ORG_KEY,
  accountId: 'primary_admin',
  username: 'admin',
  pin: '1234',
  displayName: 'Bismillah Administrator',
  role: 'Super Admin',
  fingerprintEnabled: false,
  credentialId: '',
  updatedAtIso: new Date().toISOString(),
};

export async function saveErpSectionToFirestore(
  sectionId: string,
  data: unknown,
  updatedBy = 'admin'
): Promise<void> {
  const cleanSectionId = sectionId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
  const path = `erp_sections/${cleanSectionId}`;
  try {
    const serialized = JSON.stringify(data ?? null);
    if (serialized.length > 940000) {
      console.warn(`Section ${cleanSectionId} is near Firestore 1MB limit (${serialized.length} chars)`);
    }
    const payload = {
      orgKey: ORG_KEY,
      sectionId: cleanSectionId,
      payloadJson: serialized.slice(0, 950000),
      updatedAtIso: new Date().toISOString().slice(0, 64),
      updatedBy: (updatedBy || 'admin').slice(0, 128),
    };
    await setDoc(doc(db, 'erp_sections', cleanSectionId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadAllErpSectionsFromFirestore(): Promise<{
  sections: Record<string, any>;
  timestamps: Record<string, string>;
}> {
  const path = 'erp_sections';
  try {
    const q = query(collection(db, 'erp_sections'), where('orgKey', '==', ORG_KEY));
    const snapshot = await getDocs(q);
    const sections: Record<string, any> = {};
    const timestamps: Record<string, string> = {};
    snapshot.forEach((docSnap) => {
      const d = docSnap.data();
      if (d && d.sectionId && typeof d.payloadJson === 'string') {
        try {
          sections[d.sectionId] = JSON.parse(d.payloadJson);
          timestamps[d.sectionId] = d.updatedAtIso || '';
        } catch {
          // ignore malformed JSON
        }
      }
    });
    return { sections, timestamps };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToErpSections(
  onUpdate: (sectionId: string, parsedData: any, updatedAtIso: string) => void
): () => void {
  const path = 'erp_sections';
  const q = query(collection(db, 'erp_sections'), where('orgKey', '==', ORG_KEY));
  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const d = change.doc.data();
          if (d && d.sectionId && typeof d.payloadJson === 'string') {
            try {
              const parsed = JSON.parse(d.payloadJson);
              onUpdate(d.sectionId, parsed, d.updatedAtIso || '');
            } catch {
              // ignore parse error
            }
          }
        }
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function loadPrimaryAuthAccount(): Promise<ErpAuthAccount> {
  const path = 'erp_auth_accounts/primary_admin';
  try {
    const snap = await getDoc(doc(db, 'erp_auth_accounts', 'primary_admin'));
    if (snap.exists()) {
      const data = snap.data() as ErpAuthAccount;
      if (data && data.username && data.pin) {
        return data;
      }
    }
    // Seed default account in Firestore if not present yet
    await setDoc(doc(db, 'erp_auth_accounts', 'primary_admin'), DEFAULT_AUTH_ACCOUNT);
    return DEFAULT_AUTH_ACCOUNT;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function savePrimaryAuthAccount(account: Partial<ErpAuthAccount>): Promise<ErpAuthAccount> {
  const path = 'erp_auth_accounts/primary_admin';
  try {
    const current = await loadPrimaryAuthAccount().catch(() => DEFAULT_AUTH_ACCOUNT);
    const updated: ErpAuthAccount = {
      orgKey: ORG_KEY,
      accountId: 'primary_admin',
      username: (account.username ?? current.username ?? 'admin').trim().slice(0, 64),
      pin: (account.pin ?? current.pin ?? '1234').trim().slice(0, 32),
      displayName: (account.displayName ?? current.displayName ?? 'Bismillah Administrator').trim().slice(0, 128),
      role: (account.role ?? current.role ?? 'Super Admin').trim().slice(0, 64),
      fingerprintEnabled: Boolean(account.fingerprintEnabled ?? current.fingerprintEnabled),
      credentialId: (account.credentialId ?? current.credentialId ?? '').slice(0, 512),
      updatedAtIso: new Date().toISOString().slice(0, 64),
    };
    await setDoc(doc(db, 'erp_auth_accounts', 'primary_admin'), updated);
    return updated;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc, 
  getDocs,
  Firestore,
  serverTimestamp
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User, 
  Auth 
} from 'firebase/auth';
import { getAnalytics, logEvent, Analytics, isSupported } from 'firebase/analytics';
import firebaseConfigRaw from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let isAnonymousAuthStarted = false;

try {
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigRaw.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigRaw.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigRaw.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigRaw.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigRaw.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigRaw.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigRaw.measurementId || undefined
  };

  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApp();
  }

  // Use specific Firestore database ID if provided
  const firestoreDbId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigRaw.firestoreDatabaseId;
  if (firestoreDbId) {
    db = getFirestore(app, firestoreDbId);
  } else {
    db = getFirestore(app);
  }

  auth = getAuth(app);

  // Initialize analytics safely if supported
  if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
      if (supported && app) {
        analytics = getAnalytics(app);
      }
    }).catch(() => {
      // Analytics unsupported in current container environment
    });
  }
} catch (error) {
  console.warn('Firebase initialization warning (app will use local fallback):', error);
}

// Silent background authentication helper (ensures security rules authorization without any UI login/signup)
export async function ensureSilentAuth(): Promise<boolean> {
  if (!auth) return false;
  if (auth.currentUser) return true;
  if (isAnonymousAuthStarted) return false;
  
  try {
    isAnonymousAuthStarted = true;
    await signInAnonymously(auth);
    return true;
  } catch (err) {
    console.warn('Silent anonymous auth fallback:', err);
    return false;
  } finally {
    isAnonymousAuthStarted = false;
  }
}

// Administrator Firebase Authentication helpers with server-side Custom Claims verification
let cachedAdminStatus = false;

// Verifies whether a Firebase user has the cryptographically signed `admin: true` custom claim
export async function verifyUserAdminClaim(user: User | null): Promise<boolean> {
  if (!user || user.isAnonymous) {
    cachedAdminStatus = false;
    return false;
  }
  try {
    // Force refresh token to inspect current server-minted claims
    const tokenResult = await user.getIdTokenResult(true);
    cachedAdminStatus = tokenResult.claims.admin === true;
    return cachedAdminStatus;
  } catch (err) {
    console.warn('Failed to retrieve token claims for admin verification:', err);
    cachedAdminStatus = false;
    return false;
  }
}

export function isCachedAdmin(): boolean {
  return cachedAdminStatus && !!(auth && auth.currentUser && !auth.currentUser.isAnonymous);
}

export async function adminSignIn(
  email: string, 
  password: string
): Promise<{ user: User; isAdmin: boolean }> {
  if (!auth) throw new Error('Firebase Authentication is not initialized');
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const isAdmin = await verifyUserAdminClaim(userCredential.user);
  return { user: userCredential.user, isAdmin };
}

export async function adminSignOut(): Promise<void> {
  cachedAdminStatus = false;
  if (!auth) return;
  await signOut(auth);
}

export function subscribeToAuthState(
  callback: (user: User | null, isAdmin: boolean) => void
): () => void {
  if (!auth) {
    callback(null, false);
    return () => {};
  }
  return onAuthStateChanged(auth, async (user) => {
    if (user && !user.isAnonymous) {
      const isAdmin = await verifyUserAdminClaim(user);
      callback(user, isAdmin);
    } else {
      cachedAdminStatus = false;
      callback(null, false);
    }
  });
}

// Track Anonymous Visitor Analytics Events
export async function trackAnalyticsEvent(
  eventName: string,
  eventParams: Record<string, any> = {}
) {
  try {
    // 1. Log to Firebase Web Analytics if active
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }

    // 2. Persist event to Firestore for real-time Admin Panel telemetry
    if (db) {
      await ensureSilentAuth();
      const eventsRef = collection(db, 'analytics_events');
      await addDoc(eventsRef, {
        eventName,
        details: JSON.stringify(eventParams),
        page: eventParams.page || window.location.hash || 'home',
        query: eventParams.query || '',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    // Non-blocking catch
  }
}

// Submit Anonymous Feedback to Firestore
export async function saveFeedbackToFirestore(feedbackData: {
  rating: number;
  message: string;
  category?: string;
  state?: string;
  page?: string;
  name?: string;
  mobile?: string;
  email?: string;
}): Promise<string | null> {
  if (!db) return null;
  try {
    await ensureSilentAuth();
    const fbRef = collection(db, 'feedback');
    const docRef = await addDoc(fbRef, {
      ...feedbackData,
      rating: Number(feedbackData.rating) || 5,
      message: String(feedbackData.message || '').substring(0, 2000),
      timestamp: new Date().toLocaleString(),
      createdAt: serverTimestamp()
    });
    
    // Also log analytics event
    trackAnalyticsEvent('feedback_submitted', {
      rating: feedbackData.rating,
      category: feedbackData.category || 'General'
    });

    return docRef.id;
  } catch (err) {
    console.warn('Firestore feedback submission error (fallback to local state):', err);
    return null;
  }
}

// Log Anonymous Search Query to Firestore
export async function saveSearchLogToFirestore(
  queryText: string,
  resultsCount: number,
  categoryFilter?: string
) {
  if (!db || !queryText.trim()) return;
  try {
    await ensureSilentAuth();
    const logsRef = collection(db, 'search_logs');
    await addDoc(logsRef, {
      query: queryText.trim(),
      resultsCount: Number(resultsCount) || 0,
      categoryFilter: categoryFilter || 'All',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      createdAt: serverTimestamp()
    });

    // Also log analytics event
    trackAnalyticsEvent('scheme_search', {
      query: queryText.trim(),
      resultsCount,
      categoryFilter
    });
  } catch (err) {
    // Non-blocking catch
  }
}

// Helper: Check whether caller is an authorized administrator with verified custom claims
export function isAdminAuthenticated(): boolean {
  return isCachedAdmin();
}

// Real-Time Listener for Admin Panel: Feedback (strictly requires non-anonymous admin)
export function subscribeToFeedback(
  callback: (feedbacks: any[]) => void
): () => void {
  if (!db || !isAdminAuthenticated()) {
    callback([]);
    return () => {};
  }

  const fbQuery = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(100));
  
  const unsubscribe = onSnapshot(
    fbQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.warn('Feedback real-time stream warning:', error);
    }
  );

  return unsubscribe;
}

// Real-Time Listener for Admin Panel: Search Logs (strictly requires non-anonymous admin)
export function subscribeToSearchLogs(
  callback: (logs: any[]) => void
): () => void {
  if (!db || !isAdminAuthenticated()) {
    callback([]);
    return () => {};
  }

  const logsQuery = query(collection(db, 'search_logs'), orderBy('createdAt', 'desc'), limit(50));
  
  const unsubscribe = onSnapshot(
    logsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.warn('Search logs real-time stream warning:', error);
    }
  );

  return unsubscribe;
}

// Real-Time Listener for Admin Panel: Analytics Events (strictly requires non-anonymous admin)
export function subscribeToAnalyticsEvents(
  callback: (events: any[]) => void
): () => void {
  if (!db || !isAdminAuthenticated()) {
    callback([]);
    return () => {};
  }

  const eventsQuery = query(collection(db, 'analytics_events'), orderBy('createdAt', 'desc'), limit(100));

  const unsubscribe = onSnapshot(
    eventsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.warn('Analytics events real-time stream warning:', error);
    }
  );

  return unsubscribe;
}

// Admin deletion helper for feedback (strictly requires non-anonymous admin)
export async function deleteFeedbackFromFirestore(docId: string): Promise<boolean> {
  if (!db || !isAdminAuthenticated()) return false;
  try {
    await deleteDoc(doc(db, 'feedback', docId));
    return true;
  } catch (err) {
    console.warn('Delete feedback error:', err);
    return false;
  }
}

// Admin deletion helper for search log (strictly requires non-anonymous admin)
export async function deleteSearchLogFromFirestore(docId: string): Promise<boolean> {
  if (!db || !isAdminAuthenticated()) return false;
  try {
    await deleteDoc(doc(db, 'search_logs', docId));
    return true;
  } catch (err) {
    console.warn('Delete search log error:', err);
    return false;
  }
}

export { db, auth, analytics };

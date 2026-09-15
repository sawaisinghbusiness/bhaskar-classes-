/**
 * Firebase Configuration & Authentication Service
 * Bhaskar Classes Barmer (Project: bhaskarclasses01)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  addDoc,
  collection,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDsEp6cXx5mF53ou2PJvWLuFP4bZ3Jx7K4",
  authDomain: "bhaskarclasses01.firebaseapp.com",
  projectId: "bhaskarclasses01",
  storageBucket: "bhaskarclasses01.firebasestorage.app",
  messagingSenderId: "481907626500",
  appId: "1:481907626500:web:9f63ef4a3bc47068c41b51",
  measurementId: "G-GXZGE1906X"
};

// Initialize Firebase App, Auth & Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Global helpers attached to window for easy access across pages
window.FirebaseAuth = {
  app,
  auth,
  db,
  googleProvider,
  
  // Auth state listener
  onAuthStateChanged: (callback) => onAuthStateChanged(auth, callback),
  
  // Google Sign-In
  loginWithGoogle: () => signInWithPopup(auth, googleProvider),
  
  // Email & Password Sign-In
  loginWithEmail: (email, password) => signInWithEmailAndPassword(auth, email, password),
  
  // Email & Password Registration
  registerWithEmail: async (email, password, displayName) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  },

  // Password Reset
  resetPassword: (email) => sendPasswordResetEmail(auth, email),
  
  // Sign Out
  logout: async () => {
    try {
      localStorage.removeItem('bhaskar_student_session');
    } catch (e) {}
    return signOut(auth);
  },

  // Add Firestore Inquiry / Document Helper
  addDoc: (colRef, data) => addDoc(colRef, data),

  // Current User getter
  getCurrentUser: () => auth.currentUser
};

// Keep localStorage student session in sync with auth state ONLY for actual students (never for admins)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const adminSnap = await getDoc(doc(db, "admins", user.uid));
      if (!adminSnap.exists()) {
        localStorage.setItem('bhaskar_student_session', JSON.stringify({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || (user.email ? user.email.split('@')[0] : 'विद्यार्थी'),
          phone: user.phoneNumber || ''
        }));
      } else {
        localStorage.removeItem('bhaskar_student_session');
      }
    } catch (e) {
      // Keep existing session on read error
    }
  } else {
    try {
      localStorage.removeItem('bhaskar_student_session');
    } catch (e) {}
  }
});

// Notify other scripts that Firebase is ready
window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { auth, db } }));

export {
  app,
  auth,
  db,
  googleProvider,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
};

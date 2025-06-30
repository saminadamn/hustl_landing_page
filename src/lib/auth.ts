import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { setUser, clearUser } from './sentryUtils';

// Interface for user profile data
export interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  major?: string;
  is_verified?: boolean;
  verification_level?: string;
  show_tutorial?: boolean;
  tutorial_completed?: boolean;
  last_tutorial_view?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

// Interface for sign-up data
export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  major?: string;
}

// Interface for sign-in data
export interface SignInData {
  email: string;
  password: string;
}

// Create a new user with email and password
export const signUp = async (data: SignUpData) => {
  const { email, password, full_name, major } = data;
  
  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update display name
  await updateProfile(user, {
    displayName: full_name
  });
  
  // Create user profile in Firestore
  const userProfile = {
    id: user.uid,
    full_name,
    email,
    major: major || null,
    is_verified: false,
    verification_level: 'none',
    show_tutorial: true,
    tutorial_completed: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  
  await setDoc(doc(db, 'profiles', user.uid), userProfile);
  
  // Create user stats
  await setDoc(doc(db, 'user_stats', user.uid), {
    user_id: user.uid,
    points: 0,
    tasks_completed: 0,
    total_earnings: 0,
    average_rating: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  
  // Create wallet
  await setDoc(doc(db, 'wallets', user.uid), {
    user_id: user.uid,
    balance: 0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  
  // Set user in Sentry
  setUser({
    id: user.uid,
    email: user.email || undefined,
    username: full_name
  });
  
  return { user };
};

// Sign in with email and password
export const signIn = async (data: SignInData) => {
  const { email, password } = data;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  
  // Set user in Sentry
  const user = userCredential.user;
  setUser({
    id: user.uid,
    email: user.email || undefined,
    username: user.displayName || undefined
  });
  
  return { user: userCredential.user };
};

// Sign out the current user
export const logOut = async (): Promise<void> => {
  // Clear user from Sentry
  clearUser();
  await signOut(auth);
};

// Get the current user's profile
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
  
  if (!profileDoc.exists()) {
    // If profile doesn't exist, create it
    const newProfile: Partial<UserProfile> = {
      id: user.uid,
      full_name: user.displayName || '',
      email: user.email || '',
      avatar_url: user.photoURL || '',
      major: null,
      is_verified: false,
      verification_level: 'none',
      show_tutorial: true,
      tutorial_completed: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await setDoc(doc(db, 'profiles', user.uid), newProfile);
    
    // Also create user_stats and wallet if they don't exist
    try {
      await setDoc(doc(db, 'user_stats', user.uid), {
        user_id: user.uid,
        points: 0,
        tasks_completed: 0,
        total_earnings: 0,
        average_rating: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (statsError) {
      console.error('Error creating user stats:', statsError);
    }
    
    try {
      await setDoc(doc(db, 'wallets', user.uid), {
        user_id: user.uid,
        balance: 0,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (walletError) {
      console.error('Error creating wallet:', walletError);
    }
    
    return newProfile as UserProfile;
  }
  
  return { id: user.uid, ...profileDoc.data() } as UserProfile;
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const updatedData = {
    ...updates,
    updated_at: serverTimestamp()
  };

  await updateDoc(doc(db, 'profiles', user.uid), updatedData);
  
  const updatedProfile = await getDoc(doc(db, 'profiles', user.uid));
  return { id: user.uid, ...updatedProfile.data() } as UserProfile;
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Update Sentry user context
    if (user) {
      setUser({
        id: user.uid,
        email: user.email || undefined,
        username: user.displayName || undefined
      });
    } else {
      clearUser();
    }
    
    callback(user);
  });
};

// Check if email is a UF email
export const validateUFEmail = (email: string): boolean => {
  // Allow admin emails to bypass UF email check
  const adminEmails = ['kaushalthota1@gmail.com', 'apoorvamahajan94@gmail.com'];
  if (adminEmails.includes(email)) return true;
  
  const ufEmailRegex = /@ufl\.edu$/;
  return ufEmailRegex.test(email);
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// Update password (called after user clicks reset link)
export const updatePassword = async (newPassword: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  
  await firebaseUpdatePassword(user, newPassword);
};

// Check if user exists
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    // This is a simplified check - in a real app you might want to use
    // Firebase Admin SDK or a Cloud Function to check if a user exists
    await signInWithEmailAndPassword(auth, email, 'dummy-password-for-checking');
    return true;
  } catch (error: any) {
    // If error code is auth/wrong-password, user exists but password is wrong
    if (error.code === 'auth/wrong-password') {
      return true;
    }
    // If error code is auth/user-not-found, user doesn't exist
    return false;
  }
};
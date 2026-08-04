import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  initializeUserSchema,
  DEFAULT_INITIAL_HERO,
  UserHeroSchema,
} from "@/utils/firestoreSchema";

export interface SignUpOptions {
  email: string;
  password: string;
  heroName: string;
  heroClass?: string;
}

export class UserService {
  /**
   * Create Firebase Authentication account and initialize Firestore user profile.
   */
  static async signUp({
    email,
    password,
    heroName,
    heroClass = "warrior",
  }: SignUpOptions): Promise<{ user: User; profile: UserHeroSchema | null }> {
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Use existing initializeUserSchema function
    await initializeUserSchema(user.uid, heroName, heroClass);

    const profile = await UserService.getUserProfile(user.uid);
    return { user, profile };
  }

  /**
   * Authenticate with Firebase and load Firestore user profile.
   * Automatically creates users/{uid} if missing without modifying any other collections.
   */
  static async signIn(
    email: string,
    password: string
  ): Promise<{ user: User; profile: UserHeroSchema | null }> {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    let profile = await UserService.getUserProfile(user.uid);

    // If users/{uid} does not exist, create it automatically
    if (!profile) {
      const userRef = doc(db, "users", user.uid);
      const newUserData = {
        ...DEFAULT_INITIAL_HERO,
        uid: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, newUserData, { merge: true });
      profile = await UserService.getUserProfile(user.uid);
    }

    return { user, profile };
  }

  /**
   * Sign out the currently authenticated Firebase user.
   */
  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  /**
   * Return current Firebase Auth user instance.
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Load user profile document from Firestore users/{uid}.
   */
  static async getUserProfile(uid: string): Promise<UserHeroSchema | null> {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        return snap.data() as UserHeroSchema;
      }
      return null;
    } catch (error) {
      console.error("[UserService] Error fetching user profile:", error);
      return null;
    }
  }
}

export default UserService;

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  auth, 
  signInWithGoogle, 
  signInWithEmail, 
  registerWithEmail, 
  firebaseSignOut,
  onFirebaseAuthStateChanged,
  getFirebaseIdToken
} from "@/lib/firebase";
import type { User as FirebaseUser } from "firebase/auth";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
}

async function syncWithBackend(idToken: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      credentials: "include"
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to sync with backend:", error);
    return false;
  }
}

export function useFirebaseAuth() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChanged(async (user) => {
      if (user) {
        const idToken = await user.getIdToken();
        await syncWithBackend(idToken);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
      setState({ firebaseUser: user, isLoading: false, error: null });
    });

    return () => unsubscribe();
  }, [queryClient]);

  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, idToken } = await signInWithGoogle();
      const synced = await syncWithBackend(idToken);
      if (!synced) {
        throw new Error("Failed to sync with server");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      return user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, idToken } = await signInWithEmail(email, password);
      const synced = await syncWithBackend(idToken);
      if (!synced) {
        throw new Error("Failed to sync with server");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      return user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  };

  const registerWithEmailPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { user, idToken } = await registerWithEmail(email, password);
      const synced = await syncWithBackend(idToken);
      if (!synced) {
        throw new Error("Failed to sync with server");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      return user;
    } catch (error: any) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      await fetch("/api/logout", { method: "GET", credentials: "include" });
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/";
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  };

  return {
    firebaseUser: state.firebaseUser,
    isLoading: state.isLoading,
    error: state.error,
    loginWithGoogle,
    loginWithEmailPassword,
    registerWithEmailPassword,
    logout,
    getIdToken: getFirebaseIdToken
  };
}

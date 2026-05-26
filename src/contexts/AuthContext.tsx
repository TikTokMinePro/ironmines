import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isAdmin: boolean;
  loading: boolean;
  justLoggedIn: boolean;
  clearJustLoggedIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null, user: null, profile: null, isAdmin: false, loading: true,
  justLoggedIn: false, clearJustLoggedIn: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const initialLoadDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [{ data: profileData, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);
      if (profileError) {
        console.error("Erro ao carregar perfil:", profileError.message);
      }
      if (rolesError) {
        console.error("Erro ao carregar roles:", rolesError.message);
      }
      setProfile(profileData ?? null);
      setIsAdmin(roles?.some((r: any) => r.role === "admin") ?? false);
    } catch (err) {
      console.error("Erro inesperado ao carregar perfil:", err);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    // BUG FIX: Set up the auth-state listener FIRST so we don't miss events,
    // but skip the profile fetch during the initial load — getSession() below
    // already does that. This prevents the double fetchProfile race condition.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Skip during the initial bootstrap — getSession() handles that path
        if (!initialLoadDone.current) return;

        // Subsequent auth events (SIGNED_IN, TOKEN_REFRESHED, etc.)
        // Use setTimeout to avoid the Supabase internal deadlock
        setTimeout(async () => {
          await fetchProfile(session.user.id);
          if (event === "SIGNED_IN") setJustLoggedIn(true);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        if (initialLoadDone.current) setLoading(false);
      }
    });

    // Perform the initial session bootstrap
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) console.error("Erro ao recuperar sessão:", error.message);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchProfile(session.user.id);
      })
      .catch((err) => {
        console.error("Erro inesperado ao recuperar sessão:", err);
      })
      .finally(() => {
        initialLoadDone.current = true;
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Stable references — prevent re-renders in all context consumers
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao sair:", error.message);
      }
    } catch (err) {
      console.error("Erro inesperado ao sair:", err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  const clearJustLoggedIn = useCallback(() => setJustLoggedIn(false), []);

  // Memoize the context value so referential equality is preserved when nothing changed
  const contextValue = useMemo(() => ({
    session, user, profile, isAdmin, loading, justLoggedIn, clearJustLoggedIn, signOut,
  }), [session, user, profile, isAdmin, loading, justLoggedIn, clearJustLoggedIn, signOut]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

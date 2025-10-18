import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { UserRole } from "@care4u/shared";
import api from "../lib/api";

interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  first_name?: string;
  last_name?: string;
  candidate_id?: string;
  institute_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data } = await api.get("/api/auth/me", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      setProfile(data.user);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have auth tokens in the URL hash (from magic link)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Manually set the session using the tokens from the URL with timeout
          const setSessionPromise = supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          const setSessionTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("setSession timeout")), 5000);
          });

          try {
            const result: any = await Promise.race([
              setSessionPromise,
              setSessionTimeout,
            ]);
            const { data, error } = result;

            if (error) {
              console.error("Error setting session:", error);
              setLoading(false);
              return;
            }

            if (data?.session) {
              window.history.replaceState(null, "", window.location.pathname);
              setSession(data.session);
              setUser(data.session.user);
              await fetchProfile();
              setLoading(false);
              return;
            } else {
              setLoading(false);
              return;
            }
          } catch (timeoutError) {
            // If setSession hangs, manually create session from tokens
            try {
              const payload = JSON.parse(atob(accessToken.split(".")[1]));

              const manualSession = {
                access_token: accessToken,
                refresh_token: refreshToken,
                expires_at: payload.exp,
                expires_in: payload.exp - Math.floor(Date.now() / 1000),
                token_type: "bearer",
                user: {
                  id: payload.sub,
                  email: payload.email,
                  user_metadata: payload.user_metadata,
                  app_metadata: payload.app_metadata,
                  aud: payload.aud,
                  role: payload.role,
                },
              };

              localStorage.setItem(
                "care4u-auth",
                JSON.stringify(manualSession)
              );

              setSession(manualSession as any);
              setUser(manualSession.user as any);

              window.history.replaceState(null, "", window.location.pathname);

              await fetchProfile();
              setLoading(false);
              return;
            } catch (manualError) {
              console.error("Failed to manually create session:", manualError);
              setLoading(false);
              return;
            }
          }
        }

        // No tokens in URL, try to get existing session with timeout
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("getSession timeout")), 5000);
        });

        try {
          const result: any = await Promise.race([
            getSessionPromise,
            timeoutPromise,
          ]);
          const { session } = result.data;
          const error = result.error;

          if (error) {
            console.error("Error getting session:", error);
            setLoading(false);
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile();
          }

          setLoading(false);
        } catch (timeoutError) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in auth initialization:", error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile();
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

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

  console.log("[AuthProvider] Current State:", {
    hasUser: !!user,
    hasSession: !!session,
    hasProfile: !!profile,
    loading,
    profileData: profile,
  });

  const fetchProfile = async () => {
    console.log("[AuthProvider] fetchProfile: Starting profile fetch...");
    try {
      // Add timeout to API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const { data } = await api.get("/api/auth/me", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      console.log(
        "[AuthProvider] fetchProfile: Successfully fetched profile:",
        data.user
      );
      setProfile(data.user);
    } catch (error: any) {
      console.error(
        "[AuthProvider] fetchProfile: Error fetching profile:",
        error
      );

      if (error.name === "AbortError" || error.code === "ECONNABORTED") {
        console.error(
          "[AuthProvider] fetchProfile: Request timed out after 10 seconds"
        );
        console.log(
          "[AuthProvider] fetchProfile: Backend might not be running on",
          import.meta.env.VITE_API_URL || "http://localhost:8000"
        );
      }

      setProfile(null);
    }
  };

  useEffect(() => {
    console.log(
      "[AuthProvider] useEffect: Mounting AuthProvider, initializing auth..."
    );
    console.log("[AuthProvider] useEffect: Current URL:", window.location.href);
    console.log("[AuthProvider] useEffect: URL hash:", window.location.hash);

    const initAuth = async () => {
      try {
        // Check if we have auth tokens in the URL hash (from magic link)
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log(
            "[AuthProvider] Found tokens in URL, manually setting session..."
          );
          console.log(
            "[AuthProvider] Access token length:",
            accessToken.length
          );
          console.log(
            "[AuthProvider] Refresh token length:",
            refreshToken.length
          );

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

            console.log("[AuthProvider] setSession result:", {
              hasSession: !!data?.session,
              hasError: !!error,
              error: error?.message,
            });

            if (error) {
              console.error("[AuthProvider] Error setting session:", error);
              setLoading(false);
              return;
            }

            if (data?.session) {
              console.log(
                "[AuthProvider] Session set successfully, clearing URL hash..."
              );
              // Clear the hash from URL
              window.history.replaceState(null, "", window.location.pathname);

              setSession(data.session);
              setUser(data.session.user);
              await fetchProfile();
              setLoading(false);
              return;
            } else {
              console.error(
                "[AuthProvider] setSession succeeded but no session returned"
              );
              setLoading(false);
              return;
            }
          } catch (timeoutError) {
            console.error("[AuthProvider] setSession timed out:", timeoutError);
            console.log(
              "[AuthProvider] Attempting to manually create session object from tokens..."
            );

            // If setSession hangs, try to manually store and use the tokens
            try {
              // Decode the JWT to get user info
              const payload = JSON.parse(atob(accessToken.split(".")[1]));
              console.log("[AuthProvider] Decoded token payload:", payload);

              // Manually set state with the token info
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

              console.log(
                "[AuthProvider] Created manual session, storing in localStorage..."
              );
              localStorage.setItem(
                "care4u-auth",
                JSON.stringify(manualSession)
              );

              setSession(manualSession as any);
              setUser(manualSession.user as any);

              // Clear the hash from URL
              window.history.replaceState(null, "", window.location.pathname);

              await fetchProfile();
              setLoading(false);
              return;
            } catch (manualError) {
              console.error(
                "[AuthProvider] Failed to manually create session:",
                manualError
              );
              setLoading(false);
              return;
            }
          }
        }

        // No tokens in URL, try to get existing session with timeout
        console.log(
          "[AuthProvider] No tokens in URL, checking for existing session..."
        );

        // Add timeout to getSession
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

          console.log("[AuthProvider] getSession result:", {
            hasSession: !!session,
            hasError: !!error,
          });

          if (error) {
            console.error("[AuthProvider] Error getting session:", error);
            setLoading(false);
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            console.log("[AuthProvider] Session found, fetching profile...");
            await fetchProfile();
          } else {
            console.log("[AuthProvider] No session found");
          }

          setLoading(false);
        } catch (timeoutError) {
          console.error("[AuthProvider] getSession timed out:", timeoutError);
          console.log("[AuthProvider] Forcing loading to false due to timeout");
          setLoading(false);
        }
      } catch (error) {
        console.error("[AuthProvider] Error in initAuth:", error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    console.log(
      "[AuthProvider] useEffect: Setting up auth state change listener..."
    );
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[AuthProvider] onAuthStateChange: Auth state changed:", {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      });

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log(
          "[AuthProvider] onAuthStateChange: Session exists, fetching profile..."
        );
        await fetchProfile();
      } else {
        console.log(
          "[AuthProvider] onAuthStateChange: No session, clearing profile"
        );
        setProfile(null);
      }

      console.log("[AuthProvider] onAuthStateChange: Setting loading to false");
      setLoading(false);
    });

    return () => {
      console.log("[AuthProvider] useEffect: Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("[AuthProvider] signOut: Signing out user...");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    console.log("[AuthProvider] signOut: User signed out successfully");
  };

  const refreshProfile = async () => {
    console.log("[AuthProvider] refreshProfile: Refreshing profile...");
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

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[AuthCallback] Mounted on URL:", window.location.href);
    console.log("[AuthCallback] URL hash:", window.location.hash);
    console.log("[AuthCallback] URL search:", window.location.search);

    const handleCallback = async () => {
      try {
        console.log("[AuthCallback] Starting auth callback handling...");
        console.log(
          "[AuthCallback] Timestamp before getSession:",
          new Date().toISOString()
        );

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log(
          "[AuthCallback] Timestamp after getSession:",
          new Date().toISOString()
        );
        console.log("[AuthCallback] Session result:", {
          hasSession: !!session,
          hasError: !!error,
        });

        if (error) {
          console.error("[AuthCallback] Auth error:", error);
          toast.error("Authentication failed");
          navigate("/login");
          return;
        }

        if (session) {
          console.log("[AuthCallback] Session found, navigating to home");
          // Successfully authenticated, let AuthContext handle the redirect
          toast.success("Successfully logged in!");
          navigate("/");
        } else {
          console.log("[AuthCallback] No session found, navigating to login");
          navigate("/login");
        }
      } catch (error) {
        console.error("[AuthCallback] Callback error:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingSpinner />;
};

export default AuthCallback;

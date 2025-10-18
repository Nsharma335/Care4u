import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          toast.error("Authentication failed");
          navigate("/login");
          return;
        }

        if (session) {
          toast.success("Successfully logged in!");
          navigate("/");
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Callback error:", error);
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

  return <LoadingSpinner />;
};

export default AuthCallback;

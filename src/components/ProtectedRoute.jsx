import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);
    setLoading(false);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
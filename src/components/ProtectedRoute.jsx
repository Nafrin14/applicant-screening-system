import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../supabase";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySessionAndRole = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        setSession(currentSession);
        
        // Pull user profile role from your public.profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentSession.user.id)
          .single();
          
        if (profile) {
          setRole(profile.role);
        }
      }
      setLoading(false);
    };
    
    verifySessionAndRole();
  }, []);

  if (loading) {
    return (
      <div className="h-screen bg-black text-emerald-400 flex items-center justify-center font-bold">
        Verifying Security Mappings...
      </div>
    );
  }

  // No active session token -> redirect straight back to login view layer
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // If the route has an allowedRoles rule, verify the user's role matches
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
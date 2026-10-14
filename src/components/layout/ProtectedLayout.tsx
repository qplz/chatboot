import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedLayout({ children, requiredRole }: Props) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
    if (!loading && user && requiredRole && user.role !== requiredRole) {
      navigate("/chat", { replace: true });
    }
  }, [user, loading, navigate, requiredRole]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

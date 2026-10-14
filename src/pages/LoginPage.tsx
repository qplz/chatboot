import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getApiError } from "@/lib/api";
import { Bot, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      navigate("/chat", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    const nextErrors: { email?: string; password?: string } = {};

    if (!email) {
      nextErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = "Format email tidak valid";
    }

    if (!password) {
      nextErrors.password = "Password wajib diisi";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/chat", { replace: true });
    } catch (err) {
      setServerError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 shadow-lg">
            <Bot className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Chatbot MVP</h1>
          <p className="text-sm text-gray-500">Masuk untuk melanjutkan</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white px-8 py-10 shadow-xl">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.email ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="admin@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.password ? "border-red-400" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="animate-spin" size={16} />}
              {submitting ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Default: <span className="font-mono">admin@example.com</span> /{" "}
            <span className="font-mono">Admin123!</span>
          </p>
        </div>
      </div>
    </div>
  );
}

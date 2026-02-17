"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Provider = {
  id: string;
  name: string;
  type: string;
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

function SignInPageContent() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const handleOAuthSignIn = async (providerId: string) => {
    setLoading(providerId);
    setFormError(null);
    await signIn(providerId, { callbackUrl });
  };

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }

    setLoading("credentials");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setFormError("Invalid email or password.");
      setLoading(null);
    } else if (res?.url) {
      window.location.href = res.url;
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setFormError("Email and password are required.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading("register");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || undefined, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to create account.");
        setLoading(null);
        return;
      }

      // Auto sign-in after registration
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (signInRes?.error) {
        setSuccessMessage("Account created! You can now sign in.");
        setIsCreateAccount(false);
        setPassword("");
        setConfirmPassword("");
        setLoading(null);
      } else if (signInRes?.url) {
        window.location.href = signInRes.url;
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading("demo");
    setFormError(null);
    await signIn("demo", { callbackUrl });
  };

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Error starting the sign-in flow.",
    OAuthCallback: "Error completing the sign-in.",
    OAuthCreateAccount: "Could not create account.",
    EmailCreateAccount: "Could not create account with that email.",
    Callback: "Sign-in callback error.",
    OAuthAccountNotLinked: "This email is already linked to another provider.",
    EmailSignin: "Could not send the verification email.",
    CredentialsSignin: "Invalid email or password.",
    SessionRequired: "Please sign in to continue.",
    Default: "An unexpected error occurred.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/20">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">OneChatAI</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isCreateAccount ? "Create your account" : "Sign in to continue"}
          </p>
        </div>

        {/* Error messages */}
        {(error || formError) && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {formError || (error && (errorMessages[error] || errorMessages.Default))}
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {successMessage}
          </div>
        )}

        {/* Main card */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {!providers ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Email/Password Form */}
              <form onSubmit={isCreateAccount ? handleCreateAccount : handleCredentialsSignIn} className="space-y-3">
                {isCreateAccount && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isCreateAccount ? "Min 6 characters" : "Your password"}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                  />
                </div>

                {isCreateAccount && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading !== null}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white ${
                    loading === "credentials" || loading === "register" ? "opacity-70" : ""
                  } disabled:opacity-50`}
                >
                  {(loading === "credentials" || loading === "register") ? (
                    <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {isCreateAccount ? "Create Account" : "Sign In"}
                </button>
              </form>

              {/* Toggle sign-in / create account */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateAccount(!isCreateAccount);
                    setFormError(null);
                    setSuccessMessage(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-emerald-400 text-sm hover:underline"
                >
                  {isCreateAccount
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Create one"}
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gray-900/50 px-3 text-gray-500">or continue with</span>
                </div>
              </div>

              {/* OAuth buttons */}
              <div className="flex gap-3">
                {providers.google && (
                  <button
                    onClick={() => handleOAuthSignIn("google")}
                    disabled={loading !== null}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 ${
                      loading === "google" ? "opacity-70" : ""
                    }`}
                  >
                    {loading === "google" ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GoogleIcon />
                    )}
                    Google
                  </button>
                )}

                {providers.github && (
                  <button
                    onClick={() => handleOAuthSignIn("github")}
                    disabled={loading !== null}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-[#24292f] hover:bg-[#32383f] text-white ${
                      loading === "github" ? "opacity-70" : ""
                    }`}
                  >
                    {loading === "github" ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <GitHubIcon />
                    )}
                    GitHub
                  </button>
                )}
              </div>

              {/* Demo account */}
              {providers.demo && (
                <>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-gray-900/50 px-3 text-gray-500">or try it out</span>
                    </div>
                  </div>

                  <button
                    onClick={handleDemoSignIn}
                    disabled={loading !== null}
                    className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 bg-gray-700 hover:bg-gray-600 text-white ${
                      loading === "demo" ? "opacity-70" : ""
                    }`}
                  >
                    {loading === "demo" ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                        <polyline points="10 17 15 12 10 7"/>
                        <line x1="15" y1="12" x2="3" y2="12"/>
                      </svg>
                    )}
                    Continue as Demo User
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignInPageContent />
    </Suspense>
  );
}

import { useState } from "react";
import { useSignIn, useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { DEMO_ACCOUNTS } from "@/data/demo-accounts";
import {
  Sparkles,
  Copy,
  Check,
  Loader2,
  User,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Info,
  LogOut,
} from "lucide-react";

export const DemoAccessCard = ({ compact = false, onLoginSuccess }) => {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [loadingRole, setLoadingRole] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);

  const handleCopy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleTogglePassword = (id) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleInstantLogin = async (account) => {
    if (!isSignInLoaded || !signIn) return;
    setLoadingRole(account.id);
    setErrorMessage(null);

    try {
      if (isSignedIn) {
        await signOut();
      }

      const result = await signIn.create({
        identifier: account.email,
        password: account.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        navigate(account.targetPath);
      } else {
        setErrorMessage(
          `Sign-in incomplete (status: ${result.status}). Additional verification required in Clerk.`
        );
      }
    } catch (err) {
      console.error("Demo login error:", err);
      const detail =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        "Could not sign in with demo credentials. If not yet created, register this user in Clerk.";
      setErrorMessage(detail);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      className={`rounded-md border border-border bg-card text-card-foreground shadow-sm ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
    >
      {/* Header Badge & Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-primary">
            <Sparkles size={13} />
            Quick Demo Access
          </span>
          {isSignedIn && (
            <span className="text-xs font-medium text-muted-foreground">
              Active: <strong className="text-foreground">{user?.unsafeMetadata?.role || "user"}</strong>
            </span>
          )}
        </div>

        <div>
          <h2
            className={`font-black tracking-tight text-foreground ${
              compact ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
            }`}
          >
            Instant Evaluator & Reviewer Demo
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Experience Hire Harbor directly without signing up. Select a role below for 1-click instant login or copy test credentials.
          </p>
        </div>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Notice from Auth Provider:</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Account Cards */}
      <div
        className={`mt-4 grid gap-3.5 ${
          compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {DEMO_ACCOUNTS.map((account) => {
          const isRoleLoading = loadingRole === account.id;
          const isCandidate = account.role === "candidate";
          const Icon = isCandidate ? User : Building2;

          return (
            <div
              key={account.id}
              className="group flex flex-col justify-between rounded-md border border-border bg-background/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background"
            >
              <div>
                {/* Role Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {account.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {account.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="rounded bg-accent/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                    {account.badge}
                  </span>
                </div>

                {/* Features description */}
                {!compact && (
                  <ul className="mt-3 space-y-1 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                    {account.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Credentials View & Copy */}
                <div className="mt-3 rounded border border-border/80 bg-card/60 p-2 text-xs">
                  <div className="flex items-center justify-between gap-1 py-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Email:
                    </span>
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">
                        {account.email}
                      </code>
                      <button
                        type="button"
                        aria-label={`Copy ${account.title} email`}
                        onClick={() =>
                          handleCopy(`${account.id}-email`, account.email)
                        }
                        className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        {copiedKey === `${account.id}-email` ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1 py-0.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Password:
                    </span>
                    <div className="flex items-center gap-1">
                      <code className="rounded bg-muted/60 px-1 py-0.5 font-mono text-[11px] text-foreground">
                        {showPassword[account.id] ? account.password : "••••••••••••"}
                      </code>
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => handleTogglePassword(account.id)}
                        className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        {showPassword[account.id] ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label={`Copy ${account.title} password`}
                        onClick={() =>
                          handleCopy(`${account.id}-password`, account.password)
                        }
                        className="rounded p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        {copiedKey === `${account.id}-password` ? (
                          <Check size={12} className="text-green-500" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                <Button
                  type="button"
                  size="sm"
                  variant={isCandidate ? "default" : "secondary"}
                  className="w-full font-bold transition-transform active:scale-[0.98]"
                  disabled={!isSignInLoaded || isRoleLoading}
                  onClick={() => handleInstantLogin(account)}
                >
                  {isRoleLoading ? (
                    <>
                      <Loader2 size={14} className="mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>Instant 1-Click Login</span>
                      <ArrowRight size={14} className="ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Info size={12} />
          Pre-seeded data: Candidate can apply immediately; Recruiter can manage live postings.
        </span>
        {isSignedIn && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-destructive"
          >
            <LogOut size={12} className="mr-1" />
            Sign Out Active Session
          </Button>
        )}
      </div>
    </div>
  );
};

export default DemoAccessCard;

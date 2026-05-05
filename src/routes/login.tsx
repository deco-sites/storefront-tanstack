import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRecoverPassword, useSignIn, useSignUp, useUser } from "../platform/user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type View = "signin" | "signup" | "recover";

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useUser();
  const [view, setView] = useState<View>("signin");

  const signIn = useSignIn();
  const signUp = useSignUp();
  const recover = useRecoverPassword();

  if (isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card w-full max-w-md bg-base-100 p-8 text-center shadow">
          <h1 className="mb-2 text-2xl font-semibold">You're signed in</h1>
          <p className="mb-6 text-base-content/70">Head to your account dashboard to keep going.</p>
          <Link to="/account" preload="intent" className="btn btn-primary">
            Go to my account
          </Link>
        </div>
      </div>
    );
  }

  const onSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    signIn.mutate(
      {
        email: `${data.get("email") ?? ""}`.trim(),
        password: `${data.get("password") ?? ""}`,
      },
      { onSuccess: () => navigate({ to: "/account" }) },
    );
  };

  const onSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    signUp.mutate(
      {
        email: `${data.get("email") ?? ""}`.trim(),
        password: `${data.get("password") ?? ""}`,
        firstName: `${data.get("firstName") ?? ""}`.trim() || undefined,
        lastName: `${data.get("lastName") ?? ""}`.trim() || undefined,
      },
      { onSuccess: () => navigate({ to: "/account" }) },
    );
  };

  const onRecover = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    recover.mutate({ email: `${data.get("email") ?? ""}`.trim() });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="card w-full max-w-md bg-base-100 p-8 shadow">
        {view !== "recover" && (
          <div role="tablist" className="tabs-bordered mb-6 tabs">
            <button
              type="button"
              role="tab"
              className={`tab ${view === "signin" ? "tab-active" : ""}`}
              onClick={() => setView("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${view === "signup" ? "tab-active" : ""}`}
              onClick={() => setView("signup")}
            >
              Create account
            </button>
          </div>
        )}

        {view === "signin" && (
          <form onSubmit={onSignIn} method="post" action="/login" className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold">Welcome back</h1>
            <p className="-mt-3 text-sm text-base-content/60">
              Sign in to manage your wishlist, orders and account details.
            </p>

            <label className="form-control" htmlFor="signin-email">
              <span className="label-text mb-1">Email</span>
              <input
                id="signin-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input-bordered input w-full"
                disabled={signIn.isPending}
              />
            </label>

            <label className="form-control" htmlFor="signin-password">
              <span className="label-text mb-1">Password</span>
              <input
                id="signin-password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="input-bordered input w-full"
                disabled={signIn.isPending}
              />
            </label>

            {signIn.isError && (
              <p className="text-sm text-error">
                {signIn.error instanceof Error ? signIn.error.message : "Sign-in failed."}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={signIn.isPending}>
              {signIn.isPending ? <span className="loading loading-spinner" /> : "Sign in"}
            </button>

            <button
              type="button"
              className="link self-center text-sm text-base-content/70 link-hover"
              onClick={() => {
                recover.reset();
                setView("recover");
              }}
            >
              Forgot your password?
            </button>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={onSignUp} method="post" action="/login" className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold">Create your account</h1>
            <p className="-mt-3 text-sm text-base-content/60">It only takes a minute.</p>

            <div className="grid grid-cols-2 gap-3">
              <label className="form-control" htmlFor="signup-firstname">
                <span className="label-text mb-1">First name</span>
                <input
                  id="signup-firstname"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  className="input-bordered input w-full"
                  disabled={signUp.isPending}
                />
              </label>
              <label className="form-control" htmlFor="signup-lastname">
                <span className="label-text mb-1">Last name</span>
                <input
                  id="signup-lastname"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  className="input-bordered input w-full"
                  disabled={signUp.isPending}
                />
              </label>
            </div>

            <label className="form-control" htmlFor="signup-email">
              <span className="label-text mb-1">Email</span>
              <input
                id="signup-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input-bordered input w-full"
                disabled={signUp.isPending}
              />
            </label>

            <label className="form-control" htmlFor="signup-password">
              <span className="label-text mb-1">Password</span>
              <input
                id="signup-password"
                type="password"
                name="password"
                required
                minLength={5}
                autoComplete="new-password"
                className="input-bordered input w-full"
                disabled={signUp.isPending}
              />
            </label>

            {signUp.isError && (
              <p className="text-sm text-error">
                {signUp.error instanceof Error ? signUp.error.message : "Could not create account."}
              </p>
            )}

            <button type="submit" className="btn btn-primary" disabled={signUp.isPending}>
              {signUp.isPending ? <span className="loading loading-spinner" /> : "Create account"}
            </button>
          </form>
        )}

        {view === "recover" && (
          <form onSubmit={onRecover} method="post" action="/login" className="flex flex-col gap-4">
            <h1 className="text-xl font-semibold">Reset your password</h1>
            <p className="-mt-3 text-sm text-base-content/60">
              We'll send a recovery link to your email.
            </p>

            <label className="form-control" htmlFor="recover-email">
              <span className="label-text mb-1">Email</span>
              <input
                id="recover-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input-bordered input w-full"
                disabled={recover.isPending || recover.isSuccess}
              />
            </label>

            {recover.isError && (
              <p className="text-sm text-error">
                {recover.error instanceof Error
                  ? recover.error.message
                  : "Could not send recovery email."}
              </p>
            )}

            {recover.isSuccess && (
              <p className="text-sm text-success">
                If an account exists for that email, a reset link is on its way.
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={recover.isPending || recover.isSuccess}
            >
              {recover.isPending ? <span className="loading loading-spinner" /> : "Send reset link"}
            </button>

            <button
              type="button"
              className="link self-center text-sm text-base-content/70 link-hover"
              onClick={() => setView("signin")}
            >
              ← Back to sign in
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-base-content/60">
          <Link to="/" preload="intent" className="link">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

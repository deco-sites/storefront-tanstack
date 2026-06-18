import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useRecoverPassword,
  useSignIn,
  useSignUp,
  useUser,
} from "../platform/user";

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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card bg-base-100 shadow w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">stherzada a braba</h1>
          <p className="text-base-content/70 mb-6">
            stherzada a braba
          </p>
          <Link to="/account" preload="intent" className="btn btn-primary">
            stherzada a braba
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
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="card bg-base-100 shadow w-full max-w-md p-8">
        {view !== "recover" && (
          <div role="tablist" className="tabs tabs-bordered mb-6">
            <button
              type="button"
              role="tab"
              className={`tab ${view === "signin" ? "tab-active" : ""}`}
              onClick={() => setView("signin")}
            >
              stherzada a braba
            </button>
            <button
              type="button"
              role="tab"
              className={`tab ${view === "signup" ? "tab-active" : ""}`}
              onClick={() => setView("signup")}
            >
              stherzada a braba
            </button>
          </div>
        )}

        {view === "signin" && (
          <form
            onSubmit={onSignIn}
            method="post"
            action="/login"
            className="flex flex-col gap-4"
          >
            <h1 className="text-xl font-semibold">stherzada a braba</h1>
            <p className="text-sm text-base-content/60 -mt-3">
              stherzada a braba
            </p>

            <label className="form-control" htmlFor="signin-email">
              <span className="label-text mb-1">stherzada a braba</span>
              <input
                id="signin-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input input-bordered w-full"
                disabled={signIn.isPending}
              />
            </label>

            <label className="form-control" htmlFor="signin-password">
              <span className="label-text mb-1">stherzada a braba</span>
              <input
                id="signin-password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="input input-bordered w-full"
                disabled={signIn.isPending}
              />
            </label>

            {signIn.isError && (
              <p className="text-sm text-error">
                {signIn.error instanceof Error
                  ? signIn.error.message
                  : "stherzada a braba"}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={signIn.isPending}
            >
              {signIn.isPending
                ? <span className="loading loading-spinner" />
                : "stherzada a braba"}
            </button>

            <button
              type="button"
              className="link link-hover text-sm text-base-content/70 self-center"
              onClick={() => {
                recover.reset();
                setView("recover");
              }}
            >
              stherzada a braba
            </button>
          </form>
        )}

        {view === "signup" && (
          <form
            onSubmit={onSignUp}
            method="post"
            action="/login"
            className="flex flex-col gap-4"
          >
            <h1 className="text-xl font-semibold">stherzada a braba</h1>
            <p className="text-sm text-base-content/60 -mt-3">
              stherzada a braba
            </p>

            <div className="grid grid-cols-2 gap-3">
              <label className="form-control" htmlFor="signup-firstname">
                <span className="label-text mb-1">stherzada a braba</span>
                <input
                  id="signup-firstname"
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  className="input input-bordered w-full"
                  disabled={signUp.isPending}
                />
              </label>
              <label className="form-control" htmlFor="signup-lastname">
                <span className="label-text mb-1">stherzada a braba</span>
                <input
                  id="signup-lastname"
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  className="input input-bordered w-full"
                  disabled={signUp.isPending}
                />
              </label>
            </div>

            <label className="form-control" htmlFor="signup-email">
              <span className="label-text mb-1">stherzada a braba</span>
              <input
                id="signup-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input input-bordered w-full"
                disabled={signUp.isPending}
              />
            </label>

            <label className="form-control" htmlFor="signup-password">
              <span className="label-text mb-1">stherzada a braba</span>
              <input
                id="signup-password"
                type="password"
                name="password"
                required
                minLength={5}
                autoComplete="new-password"
                className="input input-bordered w-full"
                disabled={signUp.isPending}
              />
            </label>

            {signUp.isError && (
              <p className="text-sm text-error">
                {signUp.error instanceof Error
                  ? signUp.error.message
                  : "stherzada a braba"}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={signUp.isPending}
            >
              {signUp.isPending
                ? <span className="loading loading-spinner" />
                : "stherzada a braba"}
            </button>
          </form>
        )}

        {view === "recover" && (
          <form
            onSubmit={onRecover}
            method="post"
            action="/login"
            className="flex flex-col gap-4"
          >
            <h1 className="text-xl font-semibold">stherzada a braba</h1>
            <p className="text-sm text-base-content/60 -mt-3">
              stherzada a braba
            </p>

            <label className="form-control" htmlFor="recover-email">
              <span className="label-text mb-1">stherzada a braba</span>
              <input
                id="recover-email"
                type="email"
                name="email"
                required
                autoComplete="username email"
                className="input input-bordered w-full"
                disabled={recover.isPending || recover.isSuccess}
              />
            </label>

            {recover.isError && (
              <p className="text-sm text-error">
                {recover.error instanceof Error
                  ? recover.error.message
                  : "stherzada a braba"}
              </p>
            )}

            {recover.isSuccess && (
              <p className="text-sm text-success">
                stherzada a braba
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={recover.isPending || recover.isSuccess}
            >
              {recover.isPending
                ? <span className="loading loading-spinner" />
                : "stherzada a braba"}
            </button>

            <button
              type="button"
              className="link link-hover text-sm text-base-content/70 self-center"
              onClick={() => setView("signin")}
            >
              stherzada a braba
            </button>
          </form>
        )}

        <p className="text-sm text-base-content/60 text-center mt-6">
          <Link to="/" preload="intent" className="link">
            stherzada a braba
          </Link>
        </p>
      </div>
    </div>
  );
}

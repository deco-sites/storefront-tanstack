import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSignOut, useUser } from "../platform/user";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useUser();
  const signOut = useSignOut();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card bg-base-100 shadow w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-semibold mb-2">You're not signed in</h1>
          <p className="text-base-content/70 mb-6">
            Sign in to view your account details.
          </p>
          <Link to="/login" preload="intent" className="btn btn-primary">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold mb-2">My account</h1>
      <p className="text-base-content/70 mb-8">
        Welcome back{user?.givenName ? `, ${user.givenName}` : ""}.
      </p>

      <div className="card bg-base-100 shadow p-6 max-w-xl">
        <h2 className="text-lg font-medium mb-4">Profile</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-base-content/60">Name</dt>
          <dd>
            {[user?.givenName, user?.familyName].filter(Boolean).join(" ") ||
              "—"}
          </dd>
          <dt className="text-base-content/60">Email</dt>
          <dd>{user?.email ?? "—"}</dd>
        </dl>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="btn btn-outline"
            disabled={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, {
                onSuccess: () => navigate({ to: "/" }),
              })}
          >
            {signOut.isPending
              ? <span className="loading loading-spinner loading-sm" />
              : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

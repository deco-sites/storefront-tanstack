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
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-lg loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="card w-full max-w-md bg-base-100 p-8 text-center shadow">
          <h1 className="mb-2 text-2xl font-semibold">You're not signed in</h1>
          <p className="mb-6 text-base-content/70">Sign in to view your account details.</p>
          <Link to="/login" preload="intent" className="btn btn-primary">
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold">My account</h1>
      <p className="mb-8 text-base-content/70">
        Welcome back{user?.givenName ? `, ${user.givenName}` : ""}.
      </p>

      <div className="card max-w-xl bg-base-100 p-6 shadow">
        <h2 className="mb-4 text-lg font-medium">Profile</h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
          <dt className="text-base-content/60">Name</dt>
          <dd>{[user?.givenName, user?.familyName].filter(Boolean).join(" ") || "—"}</dd>
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
              })
            }
          >
            {signOut.isPending ? (
              <span className="loading loading-sm loading-spinner" />
            ) : (
              "Sign out"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

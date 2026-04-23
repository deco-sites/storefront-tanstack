import { Link } from "@tanstack/react-router";
import { clx } from "~/sdk/clx";
import { useUser } from "../../platform/user";
import Icon from "../ui/Icon";

interface Props {
  variant: "mobile" | "desktop";
}

function SignIn({ variant }: Props) {
  const { isAuthenticated } = useUser();
  const className = clx(
    "btn btn-sm font-thin btn-ghost no-animation",
    variant === "mobile" && "btn-square",
  );

  if (isAuthenticated) {
    return (
      <Link to="/account" preload="intent" className={className} aria-label="Account">
        <Icon id="account_circle" />
        {variant === "desktop" && <span>My account</span>}
      </Link>
    );
  }

  return (
    <Link to="/login" preload="intent" className={className} aria-label="Login">
      <Icon id="account_circle" />
      {variant === "desktop" && <span>Sign in</span>}
    </Link>
  );
}

export default SignIn;

import { Person } from "@decocms/apps/commerce/types";
import { USER_ID } from "../../constants";
import { useScript } from "@decocms/start/sdk/useScript";
const onLoad = (jsonID: string) => {
  const script = document.getElementById(jsonID) as HTMLScriptElement;
  window.STOREFRONT.USER.dispatch(JSON.parse(script.innerText));
};
function UserProvider({ user }: {
  user: Person | null;
}) {
  return (
    <>
      <script
        id={USER_ID}
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(user) }}
      />
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: useScript(onLoad, USER_ID) }}
      />
    </>
  );
}
export default UserProvider;

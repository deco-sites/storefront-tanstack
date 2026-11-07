// Vendored from @decocms/apps-shopify 7.77.1 (actions/user/signUp.ts): v8's client ships no cart or customer flows. It's your code now.
import { getShopifyClient } from "../../client";
import { RegisterAccount } from "../../utils/storefront/queries";

export interface SignUpProps {
	email: string;
	password: string;
	firstName?: string;
	lastName?: string;
	acceptsMarketing?: boolean;
}

export interface SignUpResult {
	customerCreate: {
		customer?: { id: string } | null;
		customerUserErrors?: Array<{ code?: string; message: string }>;
	};
}

export default async function signUp(props: SignUpProps): Promise<SignUpResult> {
	const client = getShopifyClient();

	const data = await client.query<SignUpResult>(RegisterAccount, {
		email: props.email,
		password: props.password,
		firstName: props.firstName,
		lastName: props.lastName,
		acceptsMarketing: props.acceptsMarketing,
	});

	return data;
}

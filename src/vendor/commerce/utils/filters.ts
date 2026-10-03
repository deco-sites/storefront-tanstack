// Vendored from @decocms/apps-commerce 7.20.7 (src/utils/filters.ts). Shared commerce types and helpers live in the site in the
// next major (/next/upstream-clients#what-a-client-is); this copy is the site's own code now.
export const parseRange = (price: string) => {
	const splitted = price.split(":");

	const from = Number(splitted?.[0]);
	const to = Number(splitted?.[1]);

	return Number.isNaN(from) || Number.isNaN(to) ? null : { from, to };
};

export const formatRange = (from: number, to: number) => `${from}:${to}`;

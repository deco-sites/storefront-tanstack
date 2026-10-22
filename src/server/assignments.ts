/**
 * The tests and campaigns a request gets, decided once by the worker (src/server/edge-cache.ts) and
 * handed to the page, so the edge cache keys on exactly what the page renders.
 *
 * - The worker reads the visitor (`readVisitor`: the `deco_segment` cookie, or a new visitor) and
 *   every test of the saved `experiments` block on or off for it, every campaign of the saved
 *   `campaigns` block running or not (`readAssignments` from @decocms/tanstack, with a Studio link's
 *   version, moment and switched tests and campaigns on top).
 * - The cache key carries `assignmentsKey`: the tests on and the campaigns running, never the
 *   visitor's id, so visitors on the same side of every test share one entry and the other side gets
 *   its own.
 * - The page reads the decision from `ASSIGNMENTS_HEADER` (`forwardedAssignments`) and builds
 *   `cms.client({ ...version, experiments, campaigns })`: it decides nothing again. The worker
 *   replaces any copy of the header sent from outside, so a client can't pick a side and have it
 *   stored under another side's key.
 * - The visitor's first-visit cookie is the worker's to add, after the cache answered: a stored copy
 *   never carries it, and a preview never sends it.
 */
import type { CMS } from "@decocms/blocks";
import { readVisitor } from "@decocms/blocks/experiments";
import { assignmentsKey, readAssignments } from "@decocms/tanstack/worker";

/** The request header carrying the worker's decision to the page. */
const ASSIGNMENTS_HEADER = "x-site-assignments";

type Decided = Record<string, boolean>;

/** What the worker decided for one request. */
interface RequestDecision {
  /** The request the app gets: the original with the decision on `ASSIGNMENTS_HEADER`. */
  request: Request;
  /** `assignmentsKey`: the tests on and the campaigns running, `""` for none. Never the visitor. */
  key: string;
  /** The visitor's `Set-Cookie` on a first visit, `null` otherwise and always for a preview. */
  cookie: string | null;
}

/**
 * Decides the request's tests and campaigns for its visitor and `version` (`cms.readVersion`'s
 * answer, `null` for the release), and hands them to the app on `ASSIGNMENTS_HEADER`.
 */
export async function decideAssignments(
  cms: Pick<CMS, "client">,
  request: Request,
  version: Awaited<ReturnType<CMS["readVersion"]>>,
): Promise<RequestDecision> {
  const { visitor, cookie } = readVisitor(request);
  const assignments = await readAssignments(cms, { ...version, visitor });
  const headers = new Headers(request.headers);
  headers.set(
    ASSIGNMENTS_HEADER,
    JSON.stringify({ experiments: assignments.experiments, campaigns: assignments.campaigns }),
  );
  return {
    request: new Request(request, { headers }),
    key: assignmentsKey(assignments),
    cookie: version ? null : cookie,
  };
}

/** The request without a decision of its own (an asset): any copy sent from outside removed. */
export function withoutAssignments(request: Request): Request {
  if (!request.headers.has(ASSIGNMENTS_HEADER)) return request;
  const headers = new Headers(request.headers);
  headers.delete(ASSIGNMENTS_HEADER);
  return new Request(request, { headers });
}

function decided(value: unknown): Decided | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Decided = {};
  for (const [name, on] of Object.entries(value)) {
    if (typeof on !== "boolean") return null;
    out[name] = on;
  }
  return out;
}

/**
 * The tests and campaigns the worker decided for `request`, for `cms.client`; `null` for a request
 * that didn't come through the worker (or a header that doesn't read), which then has none: every
 * test off.
 */
export function forwardedAssignments(
  request: Request,
): { experiments: Decided; campaigns: Decided } | null {
  const raw = request.headers.get(ASSIGNMENTS_HEADER);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { experiments?: unknown; campaigns?: unknown };
    const experiments = decided(parsed.experiments);
    const campaigns = decided(parsed.campaigns);
    return experiments && campaigns ? { experiments, campaigns } : null;
  } catch {
    return null;
  }
}

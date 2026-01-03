import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/utils/auth";
import type { RoleType, PermissionMap } from "@/utils/permissions";

export type SessionType = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type RequestWithSession = NextRequest & { session: SessionType };

type RequireResult =
  | {
      ok: true;
      session: SessionType;
    }
  | { ok: false; response: NextResponse };

/**
 * Ensures the requester is authenticated and has the specified permissions.
 * Checks permissions against the requester's role from the active session.
 */
export async function requirePermission(
  request: NextRequest,
  permissions: PermissionMap
): Promise<RequireResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const role: RoleType = (session.user.role as RoleType | undefined) ?? "user";

  const check = await auth.api.userHasPermission({
    body: {
      role,
      permissions,
    },
  });

  if (!check.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "You do not have permission to access this resource" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}

/**
 * Middleware-style wrapper for route handlers enforcing permissions.
 */
export function withPermission<
  H extends (req: RequestWithSession) => Promise<NextResponse>
>(permissions: PermissionMap, handler: H) {
  return async (request: NextRequest) => {
    const result = await requirePermission(request, permissions);
    if (!result.ok) return result.response;
    const requestWithSession = Object.create(request) as RequestWithSession;
    requestWithSession.session = result.session;
    return handler(requestWithSession);
  };
}

/**
 * Ensures the requester has one of the allowed roles.
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: RoleType[]
): Promise<RequireResult> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const roleValue = (session.user.role as string | undefined) ?? "user";

  // Multiple roles may be stored as comma-separated string according to Better Auth docs
  const userRoles = roleValue.split(",").map((r) => r.trim()) as RoleType[];
  const isAllowed = userRoles.some((r) => allowedRoles.includes(r));

  if (!isAllowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "You do not have permission to access this resource" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, session };
}

/**
 * Middleware-style wrapper for route handlers enforcing role access.
 */
export function withRole<
  H extends (req: RequestWithSession) => Promise<NextResponse>
>(
  allowedRoles: RoleType[] | RoleType,
  handler: H
) {
  return async (request: NextRequest) => {
    const rolesArray = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];
    const result = await requireRole(request, rolesArray);
    if (!result.ok) return result.response;

    const requestWithSession = Object.create(request) as RequestWithSession;
    requestWithSession.session = result.session;

    return handler(requestWithSession);
  };
}

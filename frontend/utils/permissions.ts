import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

/**
 * make sure to use `as const` so typescript can infer the type correctly
 */
export const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
  test: ["run", "debug"],
} as const;

export const ac = createAccessControl(statement);

const admin = ac.newRole({
  ...adminAc.statements,
  project: ["create", "update"],
});

export const user = ac.newRole({
  ...userAc.statements,
  project: ["share"],
});

export const roles = {
  admin,
  user,
};

export type RoleType = keyof typeof roles;
export type PermissionMap = {
  [K in keyof typeof statement]?: Array<(typeof statement)[K][number]>;
};

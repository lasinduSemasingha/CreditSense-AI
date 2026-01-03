import { betterAuth, custom } from "better-auth";
import { Pool } from "pg";
import { admin } from "better-auth/plugins";
import { ac, roles } from "./permissions";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        template: "verify-email",
        data: {
          name: user.name,
          url,
          token,
        },
      });
    },
    autoSignInAfterVerification: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: true,
  },
  plugins: [
    admin({
      ac,
      roles,
      adminRoles: ["admin"],
      defaultRole: "user",
      adminUserIds: [], // Add specific user IDs that should be admin
      impersonationSessionDuration: 60 * 60 * 2, // 2 hours
      defaultBanReason: "Violation of terms of service",
      defaultBanExpiresIn: 60 * 60 * 24 * 7, // 1 week
      bannedUserMessage:
        "Your account has been suspended. Please contact support for assistance.",
    }),
  ],
  user: {
    additionalFields: {
      customerNumber: {
        type: "string",
        required: true,
        defaultValue: null,
        input: true,
      },
    },
  },
});

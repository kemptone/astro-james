import {betterAuth} from 'better-auth'
import {drizzleAdapter} from 'better-auth/adapters/drizzle'
import {db, databaseConfigured} from './database'
import {schema} from './schema'
import {sendAccountEmail} from './email'

const FALLBACK_SECRET =
  'city-temperature-development-only-secret-change-before-production'
const runtimeEnv = {...import.meta.env, ...process.env}
const baseURL =
  runtimeEnv.BETTER_AUTH_URL ||
  runtimeEnv.PUBLIC_SITE_URL ||
  'http://localhost:3000'

export const googleEnabled = Boolean(
  runtimeEnv.GOOGLE_CLIENT_ID && runtimeEnv.GOOGLE_CLIENT_SECRET,
)

export const accountsConfigured = Boolean(
  databaseConfigured &&
    runtimeEnv.BETTER_AUTH_SECRET &&
    (runtimeEnv.BETTER_AUTH_URL || runtimeEnv.PUBLIC_SITE_URL) &&
    runtimeEnv.RESEND_API_KEY &&
    runtimeEnv.AUTH_EMAIL_FROM,
)

export const auth = betterAuth({
  appName: 'City Temperature Game',
  baseURL,
  secret: runtimeEnv.BETTER_AUTH_SECRET || FALLBACK_SECRET,
  trustedOrigins: [baseURL],
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    async sendResetPassword({user, url}) {
      await sendAccountEmail({
        to: user.email,
        subject: 'Reset your City Temperature Game password',
        intro: 'Use this secure link to choose a new password.',
        action: 'Reset password',
        url,
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({user, url}) {
      await sendAccountEmail({
        to: user.email,
        subject: 'Verify your City Temperature Game email',
        intro: 'Verify your email to finish setting up your account and enable purchases.',
        action: 'Verify email',
        url,
      })
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: runtimeEnv.GOOGLE_CLIENT_ID!,
          clientSecret: runtimeEnv.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
})

export async function getRequestSession(request: Request) {
  if (!accountsConfigured) return null
  return auth.api.getSession({headers: request.headers})
}

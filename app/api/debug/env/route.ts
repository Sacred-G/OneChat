import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    SENTRY_DSN: process.env.SENTRY_DSN ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'SET' : 'NOT_SET',
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'NOT_SET',
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN ? 'SET' : 'NOT_SET',
  };

  return NextResponse.json(envVars);
}

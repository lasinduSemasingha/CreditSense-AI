import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Enable maintenance mode by setting either
// - MAINTENANCE_MODE=true | 1 (server env)
// - NEXT_PUBLIC_MAINTENANCE_MODE=true | 1 (public/build-time env)
const maintenanceEnabled =
  process.env.MAINTENANCE_MODE === '1' ||
  process.env.MAINTENANCE_MODE === 'true' ||
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === '1' ||
  process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

export function middleware(req: NextRequest) {
  // If maintenance isn't enabled, continue as normal
  if (!maintenanceEnabled) return NextResponse.next()

  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Allow the maintenance page itself and static assets to be served
  // so the page can load its CSS, images and _next files.
  if (
    pathname === '/maintenance' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // For all other requests, rewrite to the maintenance page so the URL stays
  // the same in the browser but content is the maintenance page. If you prefer
  // an actual redirect, change to NextResponse.redirect(url)
  url.pathname = '/maintenance'
  return NextResponse.rewrite(url)
}

// Run middleware for all paths (we already filter inside middleware). If you
// prefer to limit the matcher, change this config.
export const config = {
  matcher: '/:path*',
}

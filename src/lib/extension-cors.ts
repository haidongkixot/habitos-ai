import { NextResponse } from 'next/server'
import { getAllowedExtensionIds } from './extension-auth'

/**
 * Returns CORS headers for chrome-extension://<id> when the request Origin
 * matches an allowlisted extension. Returns {} for disallowed origins.
 */
export function extensionCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || ''
  const allowed = getAllowedExtensionIds().map((id) => `chrome-extension://${id}`)
  if (!origin || !allowed.includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Extension-Id',
    'Access-Control-Max-Age': '600',
  }
}

export function preflight(req: Request): NextResponse {
  const headers = extensionCorsHeaders(req)
  return new NextResponse(null, { status: 204, headers })
}

export function withCors(req: Request, res: NextResponse): NextResponse {
  const headers = extensionCorsHeaders(req)
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v)
  return res
}

export function corsJson(
  req: Request,
  body: unknown,
  init: { status?: number } = {},
): NextResponse {
  const res = NextResponse.json(body, { status: init.status ?? 200 })
  return withCors(req, res)
}

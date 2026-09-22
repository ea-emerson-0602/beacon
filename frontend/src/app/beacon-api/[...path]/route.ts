import { NextRequest, NextResponse } from "next/server"

const hopByHop = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
])

const remoteApi = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  )

const proxy = async (request: NextRequest, path: string[]) => {
  const target = `${remoteApi()}/${path.join("/")}${request.nextUrl.search}`
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (hopByHop.has(lower) || lower === "origin") return
    headers.set(key, value)
  })

  const method = request.method
  const hasBody = method !== "GET" && method !== "HEAD"

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
      redirect: "manual",
    })
  } catch {
    return NextResponse.json(
      { message: `Cannot reach the API at ${remoteApi()}` },
      { status: 502 },
    )
  }

  const out = new Headers()
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === "set-cookie" || hopByHop.has(lower)) return
    out.set(key, value)
  })

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : []
  for (const cookie of setCookies) {
    out.append("set-cookie", cookie.replace(/;\s*domain=[^;]*/gi, ""))
  }

  const body =
    upstream.status === 204 || upstream.status === 304
      ? null
      : await upstream.arrayBuffer()

  return new NextResponse(body, { status: upstream.status, headers: out })
}

const handle = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params
  return proxy(request, path)
}

export const dynamic = "force-dynamic"
export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle

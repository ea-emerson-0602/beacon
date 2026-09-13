export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

/**
 * Every request sends cookies, because the API issues an httpOnly session
 * cookie rather than handing a token to client-side JavaScript.
 */
export const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  let response: Response

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    })
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_URL}. Is the backend running?`,
      0,
    )
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[]
    } | null

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : (body?.message ?? response.statusText)

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

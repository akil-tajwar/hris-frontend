import { z } from 'zod'

type ApiResponse<T> = {
  data: T | null
  error: {
    message: string
    status?: number
    details?: unknown
  } | null
}

type FetchOptions<T> = {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  headers?: Record<string, string>
  schema?: z.ZodType<T>
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// ✅ Main fetch utility - NO manual token handling
export async function fetchApi<T>({
  url,
  method = 'GET',
  body,
  headers = {},
  schema,
}: FetchOptions<T>): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}/${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        // ❌ REMOVE Authorization header - cookie handles it
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include', // ✅ CRITICAL: Send HttpOnly cookies
    })

    // Handle unauthorized
    if (response.status === 401) {
      // ✅ Redirect to login (NO localStorage clearing needed)
      // if (typeof window !== 'undefined') {
      //   window.location.href = '/'
      // }
      return {
        data: null,
        error: {
          message: 'Unauthorized access',
          status: 401,
        },
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        data: null,
        error: {
          message: `HTTP error! status: ${response.status}`,
          status: response.status,
          details: errorData,
        },
      }
    }

    const jsonData = await response.json()

    if (schema) {
      const result = schema.safeParse(jsonData)
      if (!result.success) {
        return {
          data: null,
          error: {
            message: 'Response validation failed',
            status: 400,
            details: result.error.flatten(),
          },
        }
      }
      return { data: result.data, error: null }
    }

    return { data: jsonData as T, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
        status: 500,
      },
    }
  }
}

// ✅ File upload - also uses cookies
export async function fetchApiWithFile<T>({
  url,
  method,
  headers = {},
  body,
}: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: HeadersInit
  body?: any
}): Promise<T> {
  const isFormData = body instanceof FormData

  const finalHeaders = isFormData
    ? headers // Don't set Content-Type for FormData
    : { 'Content-Type': 'application/json', ...headers }

  const response = await fetch(`${API_BASE_URL}/${url}`, {
    method,
    headers: finalHeaders,
    body: isFormData ? body : JSON.stringify(body),
    credentials: 'include', // ✅ CRITICAL: Send HttpOnly cookies
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  return response.json()
}

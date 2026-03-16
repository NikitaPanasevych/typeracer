import { NextRequest } from 'next/server'

export function makeRequest(
  url: string,
  method: string,
  body?: unknown,
  headers?: Record<string, string>
) {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

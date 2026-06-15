export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {})
    },
    ...init
  });
}

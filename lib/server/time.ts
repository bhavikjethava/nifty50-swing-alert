export function isIndianMarketHours(date = new Date()): boolean {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  if (parts.weekday === "Sat" || parts.weekday === "Sun") {
    return false;
  }

  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
}

export function requireScanSecret(request: Request): Response | undefined {
  const configured = process.env.SCAN_SECRET;
  if (!configured) {
    return undefined;
  }

  const supplied = request.headers.get("x-scan-secret") ?? new URL(request.url).searchParams.get("secret");
  if (supplied !== configured) {
    return Response.json({ error: "Unauthorized scan request." }, { status: 401 });
  }

  return undefined;
}

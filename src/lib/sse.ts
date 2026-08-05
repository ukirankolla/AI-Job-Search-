export interface SseEvent {
  event: string;
  data: string;
}

export function parseSseEvent(part: string): SseEvent | null {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of part.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join("\n") };
}

export function parseSseBuffer(
  incoming: string,
  pending: string,
): { events: SseEvent[]; rest: string } {
  const parts = (pending + incoming).split("\n\n");
  const rest = parts.pop() ?? "";
  const events: SseEvent[] = [];
  for (const part of parts) {
    if (!part) continue;
    const evt = parseSseEvent(part);
    if (evt) events.push(evt);
  }
  return { events, rest };
}

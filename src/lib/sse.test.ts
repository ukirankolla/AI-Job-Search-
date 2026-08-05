import { describe, expect, it } from "vitest";
import { parseSseBuffer, parseSseEvent } from "@/lib/sse";

describe("parseSseEvent", () => {
  it("parses an event name with JSON data", () => {
    const part =
      'event: step\ndata: {"agent":"matcher","status":"completed"}';
    expect(parseSseEvent(part)).toEqual({
      event: "step",
      data: '{"agent":"matcher","status":"completed"}',
    });
  });

  it("defaults the event name to 'message' when missing", () => {
    expect(parseSseEvent('data: {"a":1}')).toEqual({
      event: "message",
      data: '{"a":1}',
    });
  });

  it("returns null when there is no data field", () => {
    expect(parseSseEvent("event: step\n")).toBeNull();
    expect(parseSseEvent(": comment only")).toBeNull();
  });

  it("joins multi-line data fields", () => {
    expect(parseSseEvent('data: {\ndata:   "a": 1\ndata: }')).toEqual({
      event: "message",
      data: '{\n"a": 1\n}',
    });
  });
});

describe("parseSseBuffer", () => {
  it("parses multiple events in a single chunk", () => {
    const chunk =
      'event: step\ndata: {"agent":"matcher"}\n\nevent: done\ndata: {"runId":"r1","results":{}}\n\n';
    const { events, rest } = parseSseBuffer(chunk, "");
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe("step");
    expect(events[1].event).toBe("done");
    expect(rest).toBe("");
  });

  it("keeps a partial trailing event buffered", () => {
    const chunk = 'event: done\ndata: {"runId":"r1","re';
    const { events, rest } = parseSseBuffer(chunk, "");
    expect(events).toEqual([]);
    expect(rest).toBe(chunk);
  });

  it("completes an event that was split across chunks", () => {
    const first = parseSseBuffer('event: done\ndata: {"run', "");
    expect(first.events).toEqual([]);

    const second = parseSseBuffer('Id":"r1","results":{}}\n\n', first.rest);
    expect(second.events).toHaveLength(1);
    expect(second.events[0].event).toBe("done");
    expect(second.rest).toBe("");
  });

  it("skips empty and non-data parts", () => {
    const chunk = '\n\n: hello\n\ndata: {"x":1}\n\n\n';
    const { events } = parseSseBuffer(chunk, "");
    expect(events).toHaveLength(1);
    expect(events[0].data).toBe('{"x":1}');
  });

  it("round-trips the exact wire format emitted by /api/agents/run", () => {
    const step = JSON.stringify({
      agent: "matcher",
      status: "completed",
      output: "Matched at 78/100",
      ts: "2026-08-05T00:00:00.000Z",
    });
    const chunk =
      `event: step\ndata: ${step}\n\n` +
      `event: error\ndata: {"runId":"r1","error":"boom"}\n\n`;

    const { events } = parseSseBuffer(chunk, "");
    expect(events).toHaveLength(2);

    const stepData = JSON.parse(events[0].data) as Record<string, unknown>;
    expect(events[0].event).toBe("step");
    expect(stepData).toMatchObject({ agent: "matcher", status: "completed" });

    expect(events[1].event).toBe("error");
    expect(JSON.parse(events[1].data)).toEqual({
      runId: "r1",
      error: "boom",
    });
  });
});

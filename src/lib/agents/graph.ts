import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import type {
  AgentInput,
  AgentStep,
  AgentName,
  MatchResult,
  PrepResult,
  TailorResult,
} from "@/lib/types";
import { runMatcher, runPrep, runRematch, runTailor } from "@/lib/agents/workers";

export type RunType = "analyze" | "apply" | "prep";

export const GraphState = Annotation.Root({
  input: Annotation<AgentInput>,
  steps: Annotation<AgentStep[]>({
    reducer: (left, right) => [...left, ...right],
    default: () => [],
  }),
  match: Annotation<MatchResult | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  tailor: Annotation<TailorResult | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  prep: Annotation<PrepResult | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

type State = typeof GraphState.State;

function step(
  agent: AgentName,
  status: AgentStep["status"],
  output?: string,
): AgentStep {
  return { agent, status, output, ts: new Date().toISOString() };
}

async function matcherNode(state: State): Promise<Partial<State>> {
  try {
    const result = await runMatcher(state.input);
    return {
      steps: [step("matcher", "completed", `Matched at ${result.score}/100`)],
      match: result,
    };
  } catch (err) {
    return {
      steps: [step("matcher", "failed", message(err))],
      error: message(err),
    };
  }
}

async function tailorNode(state: State): Promise<Partial<State>> {
  try {
    const result = await runTailor(state.input);
    return {
      steps: [step("tailor", "completed", "Resume + cover letter drafted")],
      tailor: result,
    };
  } catch (err) {
    return { steps: [step("tailor", "failed", message(err))], error: message(err) };
  }
}

async function prepNode(state: State): Promise<Partial<State>> {
  try {
    const result = await runPrep(state.input);
    return {
      steps: [
        step(
          "prep",
          "completed",
          `${result.questions.length} interview questions prepared`,
        ),
      ],
      prep: result,
    };
  } catch (err) {
    return { steps: [step("prep", "failed", message(err))], error: message(err) };
  }
}

async function rematchNode(state: State): Promise<Partial<State>> {
  try {
    const result = await runRematch(state.input, state.tailor?.resume ?? "");
    return {
      steps: [
        step(
          "matcher",
          "completed",
          `Matched at ${result.score}/100 after tailoring`,
        ),
      ],
      match: result,
    };
  } catch (err) {
    return { steps: [step("matcher", "failed", message(err))], error: message(err) };
  }
}

export function buildGraph(runType: RunType) {
  const graph = new StateGraph(GraphState)
    .addNode("matcher", matcherNode)
    .addEdge(START, "matcher");

  if (runType === "apply" || runType === "prep") {
    graph
      .addNode("runTailor", tailorNode)
      .addNode("rematch", rematchNode)
      .addNode("runPrep", prepNode)
      .addConditionalEdges("matcher", (state: State) =>
        state.error ? END : "runTailor",
      )
      .addConditionalEdges("runTailor", (state: State) =>
        state.error ? END : "rematch",
      )
      .addEdge("rematch", "runPrep")
      .addEdge("runPrep", END);
  } else {
    graph.addEdge("matcher", END);
  }

  return graph.compile();
}

export function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

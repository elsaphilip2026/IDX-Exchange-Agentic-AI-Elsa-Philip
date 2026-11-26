import type { AgentTask } from "./query-decomposer";

export interface ExecutionPlan {
  independent: AgentTask[];
  dependent: AgentTask[];
}

export function createExecutionPlan(
  tasks: AgentTask[]
): ExecutionPlan {

  const hasSearch = tasks.some(
    task => task.agent === "search"
  );

  const independent: AgentTask[] = [];
  const dependent: AgentTask[] = [];

  for (const task of tasks) {

    const dependsOnSearch =
      hasSearch &&
      (
        task.agent === "email" ||
        task.agent === "recommend"
      );

    if (dependsOnSearch) {
      dependent.push(task);
    } else {
      independent.push(task);
    }
  }

  return {
    independent,
    dependent,
  };
}

/**
 * Agent Provider contract.
 * A real LLM provider only needs to implement runAgent(agentId, blueprint, context)
 * and return a structured patch containing fields owned by that Agent.
 */
export class AgentProvider {
  constructor(name = 'unknown') {
    this.name = name;
  }

  async runAgent() {
    throw new Error('AgentProvider.runAgent() 尚未实现');
  }
}

export function assertProviderPatch(patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('Agent Provider 必须返回结构化 Patch');
  }
  return patch;
}

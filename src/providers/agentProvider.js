/**
 * Agent Provider contract.
 * A real LLM provider implements runAgent(agentId, blueprint, context).
 * Normal execution returns a structured patch containing fields owned by that Agent.
 * Scoped execution may use context.scope === 'sections' and must return only the
 * requested source-field updates;成果对象仍由 Blueprint service 编译。
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

/**
 * Compatibility facade for LandscapeFlow AI 2.0.
 *
 * 1.0 placed workflow control, Mock generation and report production in this
 * single file. In 2.0 those responsibilities live in:
 * - blueprint/blueprintModel.js
 * - blueprint/blueprintService.js
 * - providers/agentProvider.js
 * - providers/mockAgentProvider.js
 * - lib/reportExporter.js
 *
 * New code should call runAgentStep(). The legacy runAgent() export remains so
 * external demos importing the old module fail gracefully instead of breaking.
 */
import { applyAgentPatch, readBlueprint } from '../blueprint/blueprintService.js';
import { mockAgentProvider } from '../providers/mockAgentProvider.js';

export async function generateWithLLM() {
  return null;
}

export async function runAgentStep(agentId, blueprint, options = {}) {
  const snapshot = readBlueprint(blueprint);
  const provider = options.provider || mockAgentProvider;
  const patch = await provider.runAgent(agentId, snapshot, options);
  return applyAgentPatch(snapshot, agentId, patch, options.reason || `Provider 完成 Agent ${agentId} Patch`);
}

export async function runAgent() {
  throw new Error('LandscapeFlow AI 2.0 已改为 Blueprint 驱动。请使用 runAgentStep()，并通过 confirmCheckpoint() 管理四个人工确认节点。');
}

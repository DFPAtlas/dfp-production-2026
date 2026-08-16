import type { SandboxAdapter, SandboxAdapterConfig } from './base';
import { createSharedStagingAdapter, createUnavailableAdapter } from './base';

export type { SandboxAdapter, SandboxAdapterConfig, ProvisionedDataset, TemporaryCredential } from './base';

const adapterCache = new Map<string, SandboxAdapter>();

export function getSandboxAdapter(config: SandboxAdapterConfig): SandboxAdapter {
  const cacheKey = `${config.projectId}_${config.assignmentId}`;

  const existing = adapterCache.get(cacheKey);
  if (existing) return existing;

  const adapter = createSharedStagingAdapter(config);
  adapterCache.set(cacheKey, adapter);
  return adapter;
}

export function clearAdapterCache(): void {
  adapterCache.clear();
}
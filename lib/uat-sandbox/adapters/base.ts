export interface SandboxAdapterConfig {
  projectId: string;
  environmentId?: string | null;
  baseUrl?: string | null;
  testerId: string;
  assignmentId: string;
}

export interface ProvisionedDataset {
  recordType: string;
  displayReference: string;
  count: number;
}

export interface TemporaryCredential {
  accountType: string;
  displayName: string;
  username?: string;
  email?: string;
  credentialReference: string;
}

export interface SandboxAdapter {
  name: string;
  description: string;
  isConfigured(): boolean;
  provisionDataset(): Promise<{ success: boolean; records: ProvisionedDataset[]; error?: string }>;
  resetDataset(): Promise<{ success: boolean; error?: string }>;
  destroyDataset(): Promise<{ success: boolean; error?: string }>;
  createTemporaryAccount(): Promise<{ success: boolean; credentials: TemporaryCredential[]; error?: string }>;
  disableTemporaryAccount(): Promise<{ success: boolean; error?: string }>;
  healthCheck(): Promise<{ status: string; message?: string }>;
}

export function createUnavailableAdapter(reason: string): SandboxAdapter {
  return {
    name: 'Unavailable',
    description: reason,
    isConfigured: () => false,
    provisionDataset: async () => ({ success: false, records: [], error: reason }),
    resetDataset: async () => ({ success: false, error: reason }),
    destroyDataset: async () => ({ success: false, error: reason }),
    createTemporaryAccount: async () => ({ success: false, credentials: [], error: reason }),
    disableTemporaryAccount: async () => ({ success: false, error: reason }),
    healthCheck: async () => ({ status: 'unavailable', message: reason }),
  };
}

export function createSharedStagingAdapter(config: SandboxAdapterConfig): SandboxAdapter {
  return {
    name: 'Shared Staging',
    description: 'Uses the configured test environment without separated data',
    isConfigured: () => true,

    async provisionDataset() {
      return {
        success: true,
        records: [
          { recordType: 'test_user', displayReference: 'Shared staging user access', count: 1 },
        ],
      };
    },

    async resetDataset() {
      return { success: true };
    },

    async destroyDataset() {
      return { success: true };
    },

    async createTemporaryAccount() {
      const suffix = Math.random().toString(36).substring(2, 8);
      return {
        success: true,
        credentials: [{
          accountType: 'tester',
          displayName: `UAT Tester ${config.testerId.substring(0, 6)}`,
          username: `tester_${suffix}`,
          credentialReference: `uat-temp-${suffix}`,
        }],
      };
    },

    async disableTemporaryAccount() {
      return { success: true };
    },

    async healthCheck() {
      return { status: 'unavailable', message: 'Shared staging mode - health check not applicable' };
    },
  };
}
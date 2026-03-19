export interface TestCase {
  id: string;
  name: string;
  module: string;
  status: 'passed' | 'failed' | 'pending';
  duration: number; // ms
  generatedData: Record<string, unknown>;
  inputSchema: string;
  timestamp: string;
}

export const mockTestCases: TestCase[] = [
  {
    id: 'tc-001',
    name: 'should create user with valid email',
    module: 'UserService',
    status: 'passed',
    duration: 12,
    generatedData: {
      email: 'faker_92x@example.com',
      name: '张伟',
      age: 28,
      role: 'admin',
    },
    inputSchema: '{ email: string; name: string; age: number; role: Role }',
    timestamp: '2026-03-19T10:23:01Z',
  },
  {
    id: 'tc-002',
    name: 'should reject duplicate order ID',
    module: 'OrderService',
    status: 'failed',
    duration: 45,
    generatedData: {
      orderId: 'ORD-88421',
      items: [{ sku: 'SKU-001', qty: 3 }, { sku: 'SKU-019', qty: 1 }],
      total: 299.5,
      currency: 'CNY',
    },
    inputSchema: '{ orderId: string; items: Item[]; total: number; currency: string }',
    timestamp: '2026-03-19T10:23:02Z',
  },
  {
    id: 'tc-003',
    name: 'should calculate shipping for edge address',
    module: 'ShippingService',
    status: 'passed',
    duration: 8,
    generatedData: {
      address: '北京市朝阳区建国路88号',
      postalCode: '100022',
      weight: 2.5,
      dimensions: { l: 30, w: 20, h: 15 },
    },
    inputSchema: '{ address: string; postalCode: string; weight: number; dimensions: Dims }',
    timestamp: '2026-03-19T10:23:03Z',
  },
  {
    id: 'tc-004',
    name: 'should handle null payment method',
    module: 'PaymentService',
    status: 'passed',
    duration: 5,
    generatedData: {
      userId: 'usr-44210',
      paymentMethod: null,
      amount: 0,
      retryCount: 3,
    },
    inputSchema: '{ userId: string; paymentMethod: Method | null; amount: number }',
    timestamp: '2026-03-19T10:23:04Z',
  },
  {
    id: 'tc-005',
    name: 'should validate inventory boundary',
    module: 'InventoryService',
    status: 'pending',
    duration: 0,
    generatedData: {
      warehouseId: 'WH-03',
      sku: 'SKU-777',
      quantity: 0,
      threshold: 5,
    },
    inputSchema: '{ warehouseId: string; sku: string; quantity: number; threshold: number }',
    timestamp: '2026-03-19T10:23:05Z',
  },
  {
    id: 'tc-006',
    name: 'should parse nested config object',
    module: 'ConfigParser',
    status: 'passed',
    duration: 3,
    generatedData: {
      env: 'production',
      features: { darkMode: true, beta: false },
      limits: { maxConn: 100, timeout: 3000 },
    },
    inputSchema: '{ env: string; features: FeatureFlags; limits: Limits }',
    timestamp: '2026-03-19T10:23:06Z',
  },
  {
    id: 'tc-007',
    name: 'should send notification with template',
    module: 'NotificationService',
    status: 'failed',
    duration: 120,
    generatedData: {
      channel: 'sms',
      templateId: 'TPL-WELCOME',
      recipient: '+8613800138000',
      variables: { name: '李明', code: '882491' },
    },
    inputSchema: '{ channel: Channel; templateId: string; recipient: string; variables: Record<string, string> }',
    timestamp: '2026-03-19T10:23:07Z',
  },
  {
    id: 'tc-008',
    name: 'should merge user preferences',
    module: 'PreferenceService',
    status: 'passed',
    duration: 7,
    generatedData: {
      userId: 'usr-10032',
      locale: 'zh-CN',
      theme: 'light',
      notifications: { email: true, push: false },
    },
    inputSchema: '{ userId: string; locale: string; theme: Theme; notifications: NotifPrefs }',
    timestamp: '2026-03-19T10:23:08Z',
  },
];

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  passRate: number;
  avgDuration: number;
  totalDataFields: number;
}

export function computeSummary(cases: TestCase[]): TestSummary {
  const passed = cases.filter(c => c.status === 'passed').length;
  const failed = cases.filter(c => c.status === 'failed').length;
  const pending = cases.filter(c => c.status === 'pending').length;
  const durations = cases.filter(c => c.duration > 0).map(c => c.duration);
  const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const totalDataFields = cases.reduce((sum, c) => sum + Object.keys(c.generatedData).length, 0);

  return {
    total: cases.length,
    passed,
    failed,
    pending,
    passRate: cases.length ? Math.round((passed / cases.length) * 100) : 0,
    avgDuration: Math.round(avgDuration * 10) / 10,
    totalDataFields,
  };
}

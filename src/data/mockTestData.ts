// ========== 待测项目分析数据 ==========

export interface MethodInfo {
  name: string;
  returnType: string;
  params: string;
  complexity: number;
  linesOfCode: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  packageName: string;
  methodCount: number;
  fieldCount: number;
  complexity: number;
  linesOfCode: number;
  methods: MethodInfo[];
}

export interface ProjectAnalysis {
  projectName: string;
  language: string;
  totalClasses: number;
  totalMethods: number;
  totalLines: number;
  avgComplexity: number;
  maxComplexity: number;
  classes: ClassInfo[];
}

// ========== 生成结果数据 ==========

export interface TestMethodResult {
  name: string;
  targetMethod: string;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  assertion: string;
}

export interface TestClassResult {
  id: string;
  name: string;
  targetClass: string;
  testMethodCount: number;
  passedCount: number;
  failedCount: number;
  errorCount: number;
  lineCoverage: number;
  branchCoverage: number;
  mutationScore: number;
  duration: number;
  methods: TestMethodResult[];
}

export interface GenerationSummary {
  totalTestClasses: number;
  totalTestMethods: number;
  overallLineCoverage: number;
  overallBranchCoverage: number;
  overallMutationScore: number;
  overallPassRate: number;
  overallFailRate: number;
  totalDuration: number;
  testClasses: TestClassResult[];
}

// ========== Mock Data ==========

export const mockProjectAnalysis: ProjectAnalysis = {
  projectName: 'ecommerce-backend',
  language: 'Java',
  totalClasses: 12,
  totalMethods: 58,
  totalLines: 2340,
  avgComplexity: 4.2,
  maxComplexity: 18,
  classes: [
    {
      id: 'cls-001',
      name: 'UserService',
      packageName: 'com.app.service',
      methodCount: 6,
      fieldCount: 3,
      complexity: 5,
      linesOfCode: 180,
      methods: [
        { name: 'createUser', returnType: 'User', params: 'String email, String name', complexity: 3, linesOfCode: 25 },
        { name: 'findById', returnType: 'Optional<User>', params: 'Long id', complexity: 2, linesOfCode: 10 },
        { name: 'updateProfile', returnType: 'User', params: 'Long id, UserDTO dto', complexity: 6, linesOfCode: 35 },
        { name: 'deleteUser', returnType: 'void', params: 'Long id', complexity: 4, linesOfCode: 20 },
        { name: 'listUsers', returnType: 'List<User>', params: 'Pageable page', complexity: 3, linesOfCode: 15 },
        { name: 'validateEmail', returnType: 'boolean', params: 'String email', complexity: 8, linesOfCode: 30 },
      ],
    },
    {
      id: 'cls-002',
      name: 'OrderService',
      packageName: 'com.app.service',
      methodCount: 8,
      fieldCount: 4,
      complexity: 7,
      linesOfCode: 320,
      methods: [
        { name: 'createOrder', returnType: 'Order', params: 'OrderDTO dto', complexity: 8, linesOfCode: 45 },
        { name: 'cancelOrder', returnType: 'void', params: 'Long orderId', complexity: 6, linesOfCode: 30 },
        { name: 'calculateTotal', returnType: 'BigDecimal', params: 'List<Item> items', complexity: 5, linesOfCode: 25 },
        { name: 'applyDiscount', returnType: 'BigDecimal', params: 'BigDecimal total, String code', complexity: 10, linesOfCode: 40 },
        { name: 'processPayment', returnType: 'PaymentResult', params: 'Order order', complexity: 12, linesOfCode: 55 },
        { name: 'getOrderStatus', returnType: 'OrderStatus', params: 'Long orderId', complexity: 2, linesOfCode: 8 },
        { name: 'listOrders', returnType: 'Page<Order>', params: 'Long userId, Pageable page', complexity: 3, linesOfCode: 12 },
        { name: 'refundOrder', returnType: 'RefundResult', params: 'Long orderId, String reason', complexity: 9, linesOfCode: 38 },
      ],
    },
    {
      id: 'cls-003',
      name: 'PaymentService',
      packageName: 'com.app.service',
      methodCount: 5,
      fieldCount: 3,
      complexity: 8,
      linesOfCode: 260,
      methods: [
        { name: 'charge', returnType: 'ChargeResult', params: 'PaymentRequest req', complexity: 10, linesOfCode: 50 },
        { name: 'refund', returnType: 'RefundResult', params: 'String txnId, BigDecimal amount', complexity: 8, linesOfCode: 40 },
        { name: 'validateCard', returnType: 'boolean', params: 'CardInfo card', complexity: 12, linesOfCode: 45 },
        { name: 'getTransaction', returnType: 'Transaction', params: 'String txnId', complexity: 2, linesOfCode: 10 },
        { name: 'listTransactions', returnType: 'List<Transaction>', params: 'Long userId', complexity: 3, linesOfCode: 12 },
      ],
    },
    {
      id: 'cls-004',
      name: 'InventoryService',
      packageName: 'com.app.service',
      methodCount: 5,
      fieldCount: 2,
      complexity: 4,
      linesOfCode: 150,
      methods: [
        { name: 'checkStock', returnType: 'int', params: 'String sku', complexity: 2, linesOfCode: 8 },
        { name: 'reserveStock', returnType: 'boolean', params: 'String sku, int qty', complexity: 5, linesOfCode: 25 },
        { name: 'releaseStock', returnType: 'void', params: 'String sku, int qty', complexity: 4, linesOfCode: 20 },
        { name: 'updateThreshold', returnType: 'void', params: 'String sku, int threshold', complexity: 3, linesOfCode: 15 },
        { name: 'getLowStockItems', returnType: 'List<Item>', params: '', complexity: 6, linesOfCode: 30 },
      ],
    },
    {
      id: 'cls-005',
      name: 'ShippingCalculator',
      packageName: 'com.app.util',
      methodCount: 4,
      fieldCount: 2,
      complexity: 6,
      linesOfCode: 200,
      methods: [
        { name: 'calculateCost', returnType: 'BigDecimal', params: 'Address from, Address to, double weight', complexity: 8, linesOfCode: 40 },
        { name: 'estimateDelivery', returnType: 'LocalDate', params: 'Address to, ShipMethod method', complexity: 6, linesOfCode: 30 },
        { name: 'validateAddress', returnType: 'boolean', params: 'Address addr', complexity: 10, linesOfCode: 35 },
        { name: 'getAvailableMethods', returnType: 'List<ShipMethod>', params: 'Address to', complexity: 4, linesOfCode: 20 },
      ],
    },
    {
      id: 'cls-006',
      name: 'NotificationService',
      packageName: 'com.app.service',
      methodCount: 4,
      fieldCount: 3,
      complexity: 3,
      linesOfCode: 130,
      methods: [
        { name: 'sendEmail', returnType: 'void', params: 'String to, String template, Map vars', complexity: 4, linesOfCode: 25 },
        { name: 'sendSms', returnType: 'void', params: 'String phone, String message', complexity: 3, linesOfCode: 20 },
        { name: 'sendPush', returnType: 'void', params: 'Long userId, PushPayload payload', complexity: 3, linesOfCode: 18 },
        { name: 'getPreferences', returnType: 'NotifPrefs', params: 'Long userId', complexity: 2, linesOfCode: 10 },
      ],
    },
  ],
};

export const mockGenerationResult: GenerationSummary = {
  totalTestClasses: 6,
  totalTestMethods: 32,
  overallLineCoverage: 78.5,
  overallBranchCoverage: 65.2,
  overallMutationScore: 58.3,
  overallPassRate: 84.4,
  overallFailRate: 15.6,
  totalDuration: 3240,
  testClasses: [
    {
      id: 'tc-001',
      name: 'UserServiceTest',
      targetClass: 'UserService',
      testMethodCount: 8,
      passedCount: 7,
      failedCount: 1,
      errorCount: 0,
      lineCoverage: 92.3,
      branchCoverage: 78.6,
      mutationScore: 72.0,
      duration: 450,
      methods: [
        { name: 'testCreateUser_success', targetMethod: 'createUser', status: 'passed', duration: 45, assertion: 'assertEquals(expected, actual)' },
        { name: 'testCreateUser_duplicateEmail', targetMethod: 'createUser', status: 'passed', duration: 38, assertion: 'assertThrows(DuplicateException.class)' },
        { name: 'testFindById_exists', targetMethod: 'findById', status: 'passed', duration: 22, assertion: 'assertTrue(result.isPresent())' },
        { name: 'testFindById_notFound', targetMethod: 'findById', status: 'passed', duration: 18, assertion: 'assertFalse(result.isPresent())' },
        { name: 'testUpdateProfile_valid', targetMethod: 'updateProfile', status: 'passed', duration: 55, assertion: 'assertEquals(newName, updated.getName())' },
        { name: 'testDeleteUser_success', targetMethod: 'deleteUser', status: 'passed', duration: 30, assertion: 'verify(repo).deleteById(id)' },
        { name: 'testValidateEmail_invalid', targetMethod: 'validateEmail', status: 'failed', duration: 25, assertion: 'assertFalse(result) // got true' },
        { name: 'testListUsers_pagination', targetMethod: 'listUsers', status: 'passed', duration: 40, assertion: 'assertEquals(10, page.getSize())' },
      ],
    },
    {
      id: 'tc-002',
      name: 'OrderServiceTest',
      targetClass: 'OrderService',
      testMethodCount: 10,
      passedCount: 8,
      failedCount: 2,
      errorCount: 0,
      lineCoverage: 85.1,
      branchCoverage: 70.3,
      mutationScore: 62.5,
      duration: 820,
      methods: [
        { name: 'testCreateOrder_valid', targetMethod: 'createOrder', status: 'passed', duration: 65, assertion: 'assertNotNull(order.getId())' },
        { name: 'testCreateOrder_emptyItems', targetMethod: 'createOrder', status: 'passed', duration: 42, assertion: 'assertThrows(ValidationException.class)' },
        { name: 'testCancelOrder_success', targetMethod: 'cancelOrder', status: 'passed', duration: 55, assertion: 'assertEquals(CANCELLED, order.getStatus())' },
        { name: 'testCalculateTotal_multiItems', targetMethod: 'calculateTotal', status: 'passed', duration: 30, assertion: 'assertEquals(BigDecimal.valueOf(299.50), total)' },
        { name: 'testApplyDiscount_validCode', targetMethod: 'applyDiscount', status: 'passed', duration: 48, assertion: 'assertEquals(expected, discounted)' },
        { name: 'testApplyDiscount_expiredCode', targetMethod: 'applyDiscount', status: 'failed', duration: 35, assertion: 'assertThrows(ExpiredException.class) // no exception' },
        { name: 'testProcessPayment_success', targetMethod: 'processPayment', status: 'passed', duration: 120, assertion: 'assertTrue(result.isSuccess())' },
        { name: 'testProcessPayment_insufficientFunds', targetMethod: 'processPayment', status: 'failed', duration: 95, assertion: 'assertFalse(result.isSuccess()) // got true' },
        { name: 'testGetOrderStatus', targetMethod: 'getOrderStatus', status: 'passed', duration: 15, assertion: 'assertEquals(PENDING, status)' },
        { name: 'testRefundOrder_valid', targetMethod: 'refundOrder', status: 'passed', duration: 88, assertion: 'assertTrue(refund.isApproved())' },
      ],
    },
    {
      id: 'tc-003',
      name: 'PaymentServiceTest',
      targetClass: 'PaymentService',
      testMethodCount: 6,
      passedCount: 5,
      failedCount: 0,
      errorCount: 1,
      lineCoverage: 72.8,
      branchCoverage: 55.4,
      mutationScore: 48.0,
      duration: 680,
      methods: [
        { name: 'testCharge_success', targetMethod: 'charge', status: 'passed', duration: 110, assertion: 'assertEquals(SUCCESS, result.getStatus())' },
        { name: 'testCharge_declinedCard', targetMethod: 'charge', status: 'passed', duration: 95, assertion: 'assertEquals(DECLINED, result.getStatus())' },
        { name: 'testRefund_fullAmount', targetMethod: 'refund', status: 'passed', duration: 80, assertion: 'assertTrue(result.isRefunded())' },
        { name: 'testValidateCard_expired', targetMethod: 'validateCard', status: 'passed', duration: 25, assertion: 'assertFalse(isValid)' },
        { name: 'testValidateCard_invalidNumber', targetMethod: 'validateCard', status: 'error', duration: 30, assertion: 'NullPointerException at line 42' },
        { name: 'testGetTransaction_exists', targetMethod: 'getTransaction', status: 'passed', duration: 18, assertion: 'assertNotNull(txn)' },
      ],
    },
    {
      id: 'tc-004',
      name: 'InventoryServiceTest',
      targetClass: 'InventoryService',
      testMethodCount: 5,
      passedCount: 5,
      failedCount: 0,
      errorCount: 0,
      lineCoverage: 88.0,
      branchCoverage: 76.0,
      mutationScore: 68.5,
      duration: 320,
      methods: [
        { name: 'testCheckStock_available', targetMethod: 'checkStock', status: 'passed', duration: 12, assertion: 'assertEquals(50, stock)' },
        { name: 'testReserveStock_sufficient', targetMethod: 'reserveStock', status: 'passed', duration: 45, assertion: 'assertTrue(reserved)' },
        { name: 'testReserveStock_insufficient', targetMethod: 'reserveStock', status: 'passed', duration: 38, assertion: 'assertFalse(reserved)' },
        { name: 'testReleaseStock', targetMethod: 'releaseStock', status: 'passed', duration: 30, assertion: 'assertEquals(55, newStock)' },
        { name: 'testGetLowStockItems', targetMethod: 'getLowStockItems', status: 'passed', duration: 22, assertion: 'assertEquals(3, items.size())' },
      ],
    },
    {
      id: 'tc-005',
      name: 'ShippingCalculatorTest',
      targetClass: 'ShippingCalculator',
      testMethodCount: 4,
      passedCount: 3,
      failedCount: 1,
      errorCount: 0,
      lineCoverage: 65.0,
      branchCoverage: 50.0,
      mutationScore: 42.0,
      duration: 280,
      methods: [
        { name: 'testCalculateCost_domestic', targetMethod: 'calculateCost', status: 'passed', duration: 55, assertion: 'assertEquals(BigDecimal.valueOf(15.00), cost)' },
        { name: 'testEstimateDelivery_express', targetMethod: 'estimateDelivery', status: 'passed', duration: 40, assertion: 'assertEquals(expectedDate, date)' },
        { name: 'testValidateAddress_invalid', targetMethod: 'validateAddress', status: 'failed', duration: 35, assertion: 'assertFalse(valid) // got true' },
        { name: 'testGetAvailableMethods', targetMethod: 'getAvailableMethods', status: 'passed', duration: 28, assertion: 'assertFalse(methods.isEmpty())' },
      ],
    },
    {
      id: 'tc-006',
      name: 'NotificationServiceTest',
      targetClass: 'NotificationService',
      testMethodCount: 3,
      passedCount: 3,
      failedCount: 0,
      errorCount: 0,
      lineCoverage: 70.0,
      branchCoverage: 58.0,
      mutationScore: 52.0,
      duration: 190,
      methods: [
        { name: 'testSendEmail_success', targetMethod: 'sendEmail', status: 'passed', duration: 65, assertion: 'verify(mailer).send(any())' },
        { name: 'testSendSms_success', targetMethod: 'sendSms', status: 'passed', duration: 45, assertion: 'verify(smsClient).send(phone, message)' },
        { name: 'testGetPreferences', targetMethod: 'getPreferences', status: 'passed', duration: 20, assertion: 'assertTrue(prefs.isEmailEnabled())' },
      ],
    },
  ],
};

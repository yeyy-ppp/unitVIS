// ========== 待测项目分析数据 ==========

export interface MethodInfo {
  name: string;
  returnType: string;
  params: string;
  complexity: number;
  linesOfCode: number;
  body: string;
  /** 大模型生成：方法功能 / 目标 / 测试焦点 */
  focus?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  packageName: string;
  fieldCount: number;
  methods: MethodInfo[];
  /** 大模型生成：对该类整体的功能/职责/测试关注点摘要 */
  analysis?: string;
}

export interface ProjectAnalysis {
  projectName: string;
  language: string;
  classes: ClassInfo[];
}

// ========== 生成结果数据 ==========

export interface TestMethodResult {
  name: string;
  targetMethod: string;
  status: 'passed' | 'failed' | 'error';
  duration: number;
  assertion: string;
  body: string;
  /** 失败原因（断言信息或异常） */
  failureReason?: string;
  /** 失败位置（文件:行 或 调用栈） */
  failureLocation?: string;
}

export interface TestClassResult {
  id: string;
  name: string;
  targetClass: string;
  lineCoverage: number;
  branchCoverage: number;
  mutationScore: number;
  methods: TestMethodResult[];
}

export interface GenerationSummary {
  overallLineCoverage: number;
  overallBranchCoverage: number;
  overallMutationScore: number;
  /** 指令覆盖率 (Instruction) */
  overallInstructionCoverage: number;
  /** 方法覆盖率 */
  overallMethodCoverage: number;
  /** 类覆盖率 */
  overallClassCoverage: number;
  /** 测试涵盖代码的平均圈复杂度 */
  overallComplexity: number;
  testClasses: TestClassResult[];
}

// ========== 派生计算（保证与列表一致）==========

export function computeClassMetrics(c: ClassInfo) {
  const methodCount = c.methods.length;
  const linesOfCode = c.methods.reduce((s, m) => s + m.linesOfCode, 0);
  const complexity = c.methods.reduce((m, x) => Math.max(m, x.complexity), 0);
  return { methodCount, linesOfCode, complexity };
}

export function computeProjectTotals(p: ProjectAnalysis) {
  let totalMethods = 0, totalLines = 0, complexitySum = 0, maxComplexity = 0;
  p.classes.forEach(c => {
    const m = computeClassMetrics(c);
    totalMethods += m.methodCount;
    totalLines += m.linesOfCode;
    complexitySum += m.complexity;
    maxComplexity = Math.max(maxComplexity, m.complexity);
  });
  return {
    totalClasses: p.classes.length,
    totalMethods,
    totalLines,
    avgComplexity: p.classes.length ? +(complexitySum / p.classes.length).toFixed(1) : 0,
    maxComplexity,
  };
}

export function computeTestClassMetrics(tc: TestClassResult) {
  const testMethodCount = tc.methods.length;
  const passedCount = tc.methods.filter(m => m.status === 'passed').length;
  const failedCount = tc.methods.filter(m => m.status === 'failed').length;
  const errorCount = tc.methods.filter(m => m.status === 'error').length;
  const duration = tc.methods.reduce((s, m) => s + m.duration, 0);
  return { testMethodCount, passedCount, failedCount, errorCount, duration };
}

export function computeGenerationTotals(g: GenerationSummary) {
  let totalTestMethods = 0, passed = 0, failed = 0, errored = 0, totalDuration = 0;
  g.testClasses.forEach(tc => {
    const m = computeTestClassMetrics(tc);
    totalTestMethods += m.testMethodCount;
    passed += m.passedCount;
    failed += m.failedCount;
    errored += m.errorCount;
    totalDuration += m.duration;
  });
  const failOrErr = failed + errored;
  return {
    totalTestClasses: g.testClasses.length,
    totalTestMethods,
    passed, failed, errored,
    totalDuration,
    overallPassRate: totalTestMethods ? +(passed / totalTestMethods * 100).toFixed(1) : 0,
    overallFailRate: totalTestMethods ? +(failOrErr / totalTestMethods * 100).toFixed(1) : 0,
  };
}

// ========== Mock Data ==========

const j = (s: string) => s.replace(/^\n/, '');

export const mockProjectAnalysis: ProjectAnalysis = {
  projectName: 'ecommerce-backend',
  language: 'Java',
  classes: [
    {
      id: 'cls-001',
      name: 'UserService',
      packageName: 'com.app.service',
      fieldCount: 3,
      methods: [
        {
          name: 'createUser', returnType: 'User', params: 'String email, String name', complexity: 3, linesOfCode: 12,
          body: j(`
public User createUser(String email, String name) {
    if (email == null || email.isBlank()) {
        throw new IllegalArgumentException("email required");
    }
    if (userRepo.existsByEmail(email)) {
        throw new DuplicateException("email exists");
    }
    User u = new User();
    u.setEmail(email);
    u.setName(name);
    u.setCreatedAt(Instant.now());
    return userRepo.save(u);
}`),
        },
        {
          name: 'findById', returnType: 'Optional<User>', params: 'Long id', complexity: 2, linesOfCode: 4,
          body: j(`
public Optional<User> findById(Long id) {
    if (id == null) return Optional.empty();
    return userRepo.findById(id);
}`),
        },
        {
          name: 'updateProfile', returnType: 'User', params: 'Long id, UserDTO dto', complexity: 6, linesOfCode: 14,
          body: j(`
public User updateProfile(Long id, UserDTO dto) {
    User u = userRepo.findById(id)
        .orElseThrow(() -> new NotFoundException("user " + id));
    if (dto.getName() != null)  u.setName(dto.getName());
    if (dto.getEmail() != null) u.setEmail(dto.getEmail());
    if (dto.getPhone() != null) u.setPhone(dto.getPhone());
    if (dto.getAvatar() != null) u.setAvatar(dto.getAvatar());
    u.setUpdatedAt(Instant.now());
    return userRepo.save(u);
}`),
        },
        {
          name: 'deleteUser', returnType: 'void', params: 'Long id', complexity: 4, linesOfCode: 8,
          body: j(`
public void deleteUser(Long id) {
    User u = userRepo.findById(id)
        .orElseThrow(() -> new NotFoundException("user " + id));
    if (u.isAdmin()) throw new ForbiddenException("cannot delete admin");
    userRepo.delete(u);
}`),
        },
        {
          name: 'validateEmail', returnType: 'boolean', params: 'String email', complexity: 8, linesOfCode: 14,
          body: j(`
public boolean validateEmail(String email) {
    if (email == null || email.length() > 254) return false;
    int at = email.indexOf('@');
    if (at <= 0 || at == email.length() - 1) return false;
    String local = email.substring(0, at);
    String domain = email.substring(at + 1);
    if (local.startsWith(".") || local.endsWith(".")) return false;
    if (!domain.contains(".")) return false;
    return EMAIL_REGEX.matcher(email).matches();
}`),
        },
      ],
    },
    {
      id: 'cls-002',
      name: 'OrderService',
      packageName: 'com.app.service',
      fieldCount: 4,
      methods: [
        {
          name: 'createOrder', returnType: 'Order', params: 'OrderDTO dto', complexity: 8, linesOfCode: 16,
          body: j(`
public Order createOrder(OrderDTO dto) {
    if (dto.getItems() == null || dto.getItems().isEmpty()) {
        throw new ValidationException("items required");
    }
    Order o = new Order();
    o.setUserId(dto.getUserId());
    for (ItemDTO it : dto.getItems()) {
        if (!inventory.reserveStock(it.getSku(), it.getQty())) {
            throw new OutOfStockException(it.getSku());
        }
        o.addItem(it.toEntity());
    }
    o.setTotal(calculateTotal(o.getItems()));
    o.setStatus(OrderStatus.PENDING);
    return orderRepo.save(o);
}`),
        },
        {
          name: 'cancelOrder', returnType: 'void', params: 'Long orderId', complexity: 6, linesOfCode: 11,
          body: j(`
public void cancelOrder(Long orderId) {
    Order o = orderRepo.findById(orderId)
        .orElseThrow(() -> new NotFoundException("order " + orderId));
    if (o.getStatus() == OrderStatus.SHIPPED) {
        throw new IllegalStateException("already shipped");
    }
    o.getItems().forEach(it -> inventory.releaseStock(it.getSku(), it.getQty()));
    o.setStatus(OrderStatus.CANCELLED);
    orderRepo.save(o);
}`),
        },
        {
          name: 'calculateTotal', returnType: 'BigDecimal', params: 'List<Item> items', complexity: 3, linesOfCode: 6,
          body: j(`
public BigDecimal calculateTotal(List<Item> items) {
    return items.stream()
        .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQty())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}`),
        },
        {
          name: 'applyDiscount', returnType: 'BigDecimal', params: 'BigDecimal total, String code', complexity: 10, linesOfCode: 14,
          body: j(`
public BigDecimal applyDiscount(BigDecimal total, String code) {
    Coupon c = couponRepo.findByCode(code)
        .orElseThrow(() -> new NotFoundException("coupon"));
    if (c.getExpiresAt().isBefore(Instant.now())) {
        throw new ExpiredException("coupon expired");
    }
    if (c.getMinAmount() != null && total.compareTo(c.getMinAmount()) < 0) {
        throw new ValidationException("min amount not met");
    }
    BigDecimal discount = c.getType() == CouponType.PERCENT
        ? total.multiply(c.getValue()).divide(BigDecimal.valueOf(100))
        : c.getValue();
    return total.subtract(discount).max(BigDecimal.ZERO);
}`),
        },
        {
          name: 'processPayment', returnType: 'PaymentResult', params: 'Order order', complexity: 9, linesOfCode: 14,
          body: j(`
public PaymentResult processPayment(Order order) {
    if (order.getStatus() != OrderStatus.PENDING) {
        throw new IllegalStateException("order not payable");
    }
    PaymentRequest req = PaymentRequest.builder()
        .amount(order.getTotal())
        .currency("USD")
        .userId(order.getUserId())
        .build();
    PaymentResult r = paymentGateway.charge(req);
    if (r.isSuccess()) {
        order.setStatus(OrderStatus.PAID);
        orderRepo.save(order);
    }
    return r;
}`),
        },
      ],
    },
    {
      id: 'cls-003',
      name: 'PaymentService',
      packageName: 'com.app.service',
      fieldCount: 3,
      methods: [
        {
          name: 'charge', returnType: 'ChargeResult', params: 'PaymentRequest req', complexity: 10, linesOfCode: 16,
          body: j(`
public ChargeResult charge(PaymentRequest req) {
    if (req.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
        return ChargeResult.declined("invalid amount");
    }
    if (!validateCard(req.getCard())) {
        return ChargeResult.declined("invalid card");
    }
    try {
        StripeResponse resp = stripe.charge(req.toStripe());
        if (resp.isSuccess()) {
            txnRepo.save(Transaction.from(resp));
            return ChargeResult.success(resp.getId());
        }
        return ChargeResult.declined(resp.getError());
    } catch (StripeException e) {
        log.error("charge failed", e);
        return ChargeResult.error(e.getMessage());
    }
}`),
        },
        {
          name: 'refund', returnType: 'RefundResult', params: 'String txnId, BigDecimal amount', complexity: 6, linesOfCode: 11,
          body: j(`
public RefundResult refund(String txnId, BigDecimal amount) {
    Transaction t = txnRepo.findById(txnId)
        .orElseThrow(() -> new NotFoundException("txn " + txnId));
    if (amount.compareTo(t.getAmount()) > 0) {
        throw new ValidationException("refund exceeds charge");
    }
    StripeResponse resp = stripe.refund(txnId, amount);
    return resp.isSuccess()
        ? RefundResult.ok(resp.getId())
        : RefundResult.failed(resp.getError());
}`),
        },
        {
          name: 'validateCard', returnType: 'boolean', params: 'CardInfo card', complexity: 12, linesOfCode: 13,
          body: j(`
public boolean validateCard(CardInfo card) {
    if (card == null) return false;
    String num = card.getNumber();
    if (num == null || !num.matches("\\\\d{13,19}")) return false;
    if (card.getExpMonth() < 1 || card.getExpMonth() > 12) return false;
    if (card.getExpYear() < LocalDate.now().getYear()) return false;
    if (card.getCvv() == null || !card.getCvv().matches("\\\\d{3,4}")) return false;
    int sum = 0; boolean alt = false;
    for (int i = num.length() - 1; i >= 0; i--) {
        int n = num.charAt(i) - '0';
        if (alt) { n *= 2; if (n > 9) n -= 9; }
        sum += n; alt = !alt;
    }
    return sum % 10 == 0;
}`),
        },
        {
          name: 'getTransaction', returnType: 'Transaction', params: 'String txnId', complexity: 2, linesOfCode: 4,
          body: j(`
public Transaction getTransaction(String txnId) {
    return txnRepo.findById(txnId)
        .orElseThrow(() -> new NotFoundException("txn " + txnId));
}`),
        },
      ],
    },
    {
      id: 'cls-004',
      name: 'InventoryService',
      packageName: 'com.app.service',
      fieldCount: 2,
      methods: [
        {
          name: 'checkStock', returnType: 'int', params: 'String sku', complexity: 2, linesOfCode: 4,
          body: j(`
public int checkStock(String sku) {
    return stockRepo.findBySku(sku).map(Stock::getQty).orElse(0);
}`),
        },
        {
          name: 'reserveStock', returnType: 'boolean', params: 'String sku, int qty', complexity: 5, linesOfCode: 9,
          body: j(`
public boolean reserveStock(String sku, int qty) {
    Stock s = stockRepo.findBySku(sku).orElse(null);
    if (s == null || s.getQty() < qty) return false;
    s.setQty(s.getQty() - qty);
    s.setReserved(s.getReserved() + qty);
    stockRepo.save(s);
    return true;
}`),
        },
        {
          name: 'releaseStock', returnType: 'void', params: 'String sku, int qty', complexity: 4, linesOfCode: 7,
          body: j(`
public void releaseStock(String sku, int qty) {
    Stock s = stockRepo.findBySku(sku)
        .orElseThrow(() -> new NotFoundException(sku));
    s.setQty(s.getQty() + qty);
    s.setReserved(Math.max(0, s.getReserved() - qty));
    stockRepo.save(s);
}`),
        },
        {
          name: 'getLowStockItems', returnType: 'List<Item>', params: '', complexity: 6, linesOfCode: 8,
          body: j(`
public List<Item> getLowStockItems() {
    return stockRepo.findAll().stream()
        .filter(s -> s.getQty() < s.getThreshold())
        .map(Stock::toItem)
        .sorted(Comparator.comparingInt(Item::getQty))
        .collect(Collectors.toList());
}`),
        },
      ],
    },
    {
      id: 'cls-005',
      name: 'ShippingCalculator',
      packageName: 'com.app.util',
      fieldCount: 2,
      methods: [
        {
          name: 'calculateCost', returnType: 'BigDecimal', params: 'Address from, Address to, double weight', complexity: 8, linesOfCode: 13,
          body: j(`
public BigDecimal calculateCost(Address from, Address to, double weight) {
    if (weight <= 0) throw new IllegalArgumentException("weight");
    double distance = geo.distance(from, to);
    BigDecimal base = BigDecimal.valueOf(5);
    BigDecimal perKm = BigDecimal.valueOf(distance * 0.05);
    BigDecimal perKg = BigDecimal.valueOf(weight * 1.2);
    BigDecimal cost = base.add(perKm).add(perKg);
    if (!from.getCountry().equals(to.getCountry())) {
        cost = cost.multiply(BigDecimal.valueOf(2.5));
    }
    return cost.setScale(2, RoundingMode.HALF_UP);
}`),
        },
        {
          name: 'estimateDelivery', returnType: 'LocalDate', params: 'Address to, ShipMethod method', complexity: 6, linesOfCode: 9,
          body: j(`
public LocalDate estimateDelivery(Address to, ShipMethod method) {
    int days = switch (method) {
        case EXPRESS -> 2;
        case STANDARD -> 5;
        case ECONOMY -> 10;
    };
    if (to.isRemote()) days += 3;
    return LocalDate.now().plusDays(days);
}`),
        },
        {
          name: 'validateAddress', returnType: 'boolean', params: 'Address addr', complexity: 10, linesOfCode: 9,
          body: j(`
public boolean validateAddress(Address addr) {
    if (addr == null) return false;
    if (isBlank(addr.getStreet())) return false;
    if (isBlank(addr.getCity())) return false;
    if (isBlank(addr.getCountry())) return false;
    if (addr.getZipCode() == null) return false;
    if (!ZIP_PATTERNS.getOrDefault(addr.getCountry(), DEFAULT_ZIP)
            .matcher(addr.getZipCode()).matches()) return false;
    return true;
}`),
        },
      ],
    },
    {
      id: 'cls-006',
      name: 'NotificationService',
      packageName: 'com.app.service',
      fieldCount: 3,
      methods: [
        {
          name: 'sendEmail', returnType: 'void', params: 'String to, String template, Map vars', complexity: 4, linesOfCode: 8,
          body: j(`
public void sendEmail(String to, String template, Map<String, Object> vars) {
    String body = templateEngine.render(template, vars);
    EmailMessage msg = EmailMessage.builder()
        .to(to).subject(vars.getOrDefault("subject", "").toString())
        .body(body).build();
    mailer.send(msg);
}`),
        },
        {
          name: 'sendSms', returnType: 'void', params: 'String phone, String message', complexity: 3, linesOfCode: 5,
          body: j(`
public void sendSms(String phone, String message) {
    if (!phone.startsWith("+")) phone = "+1" + phone;
    smsClient.send(phone, message);
}`),
        },
        {
          name: 'getPreferences', returnType: 'NotifPrefs', params: 'Long userId', complexity: 2, linesOfCode: 4,
          body: j(`
public NotifPrefs getPreferences(Long userId) {
    return prefsRepo.findByUserId(userId).orElse(NotifPrefs.defaults());
}`),
        },
      ],
    },
  ],
};

const tBody = (name: string, target: string, status: string, body: string) => body;

export const mockGenerationResult: GenerationSummary = {
  overallLineCoverage: 78.5,
  overallBranchCoverage: 65.2,
  overallMutationScore: 58.3,
  overallInstructionCoverage: 81.2,
  overallMethodCoverage: 73.6,
  overallClassCoverage: 100,
  overallComplexity: 5.8,
  testClasses: [
    {
      id: 'tc-001', name: 'UserServiceTest', targetClass: 'UserService',
      lineCoverage: 92.3, branchCoverage: 78.6, mutationScore: 72.0,
      methods: [
        { name: 'testCreateUser_success', targetMethod: 'createUser', status: 'passed', duration: 45,
          assertion: 'assertEquals(expected, actual)',
          body: j(`
@Test
void testCreateUser_success() {
    when(userRepo.existsByEmail("a@b.com")).thenReturn(false);
    when(userRepo.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
    User u = service.createUser("a@b.com", "Alice");
    assertEquals("a@b.com", u.getEmail());
    assertEquals("Alice", u.getName());
    assertNotNull(u.getCreatedAt());
}`) },
        { name: 'testCreateUser_duplicateEmail', targetMethod: 'createUser', status: 'passed', duration: 38,
          assertion: 'assertThrows(DuplicateException.class)',
          body: j(`
@Test
void testCreateUser_duplicateEmail() {
    when(userRepo.existsByEmail("dup@x.com")).thenReturn(true);
    assertThrows(DuplicateException.class,
        () -> service.createUser("dup@x.com", "Bob"));
}`) },
        { name: 'testFindById_exists', targetMethod: 'findById', status: 'passed', duration: 22,
          assertion: 'assertTrue(result.isPresent())',
          body: j(`
@Test
void testFindById_exists() {
    when(userRepo.findById(1L)).thenReturn(Optional.of(new User()));
    assertTrue(service.findById(1L).isPresent());
}`) },
        { name: 'testUpdateProfile_valid', targetMethod: 'updateProfile', status: 'passed', duration: 55,
          assertion: 'assertEquals(newName, updated.getName())',
          body: j(`
@Test
void testUpdateProfile_valid() {
    User existing = new User(); existing.setId(1L);
    when(userRepo.findById(1L)).thenReturn(Optional.of(existing));
    when(userRepo.save(any())).thenAnswer(i -> i.getArgument(0));
    UserDTO dto = new UserDTO(); dto.setName("New");
    User updated = service.updateProfile(1L, dto);
    assertEquals("New", updated.getName());
}`) },
        { name: 'testValidateEmail_invalid', targetMethod: 'validateEmail', status: 'failed', duration: 25,
          assertion: 'assertFalse(result) // got true',
          body: j(`
@Test
void testValidateEmail_invalid() {
    // expected false for malformed email, but implementation returned true
    assertFalse(service.validateEmail("foo@bar"));
}
// Failure: expected <false> but got <true>`) },
      ],
    },
    {
      id: 'tc-002', name: 'OrderServiceTest', targetClass: 'OrderService',
      lineCoverage: 85.1, branchCoverage: 70.3, mutationScore: 62.5,
      methods: [
        { name: 'testCreateOrder_valid', targetMethod: 'createOrder', status: 'passed', duration: 65,
          assertion: 'assertNotNull(order.getId())',
          body: j(`
@Test
void testCreateOrder_valid() {
    OrderDTO dto = new OrderDTO();
    dto.setUserId(1L);
    dto.setItems(List.of(new ItemDTO("SKU1", 2)));
    when(inventory.reserveStock(anyString(), anyInt())).thenReturn(true);
    when(orderRepo.save(any())).thenAnswer(i -> {
        Order o = i.getArgument(0); o.setId(99L); return o;
    });
    Order o = service.createOrder(dto);
    assertNotNull(o.getId());
    assertEquals(OrderStatus.PENDING, o.getStatus());
}`) },
        { name: 'testCreateOrder_emptyItems', targetMethod: 'createOrder', status: 'passed', duration: 42,
          assertion: 'assertThrows(ValidationException.class)',
          body: j(`
@Test
void testCreateOrder_emptyItems() {
    OrderDTO dto = new OrderDTO();
    dto.setItems(List.of());
    assertThrows(ValidationException.class, () -> service.createOrder(dto));
}`) },
        { name: 'testCalculateTotal_multiItems', targetMethod: 'calculateTotal', status: 'passed', duration: 30,
          assertion: 'assertEquals(BigDecimal.valueOf(299.50), total)',
          body: j(`
@Test
void testCalculateTotal_multiItems() {
    List<Item> items = List.of(
        new Item("A", BigDecimal.valueOf(99.50), 1),
        new Item("B", BigDecimal.valueOf(100.00), 2));
    assertEquals(0, BigDecimal.valueOf(299.50).compareTo(service.calculateTotal(items)));
}`) },
        { name: 'testApplyDiscount_expiredCode', targetMethod: 'applyDiscount', status: 'failed', duration: 35,
          assertion: 'assertThrows(ExpiredException.class) // no exception',
          body: j(`
@Test
void testApplyDiscount_expiredCode() {
    Coupon c = new Coupon("OLD", BigDecimal.TEN, CouponType.FIXED);
    c.setExpiresAt(Instant.now().minusSeconds(3600));
    when(couponRepo.findByCode("OLD")).thenReturn(Optional.of(c));
    assertThrows(ExpiredException.class,
        () -> service.applyDiscount(BigDecimal.valueOf(100), "OLD"));
}
// Failure: expected ExpiredException to be thrown but nothing was thrown`) },
        { name: 'testProcessPayment_success', targetMethod: 'processPayment', status: 'passed', duration: 120,
          assertion: 'assertTrue(result.isSuccess())',
          body: j(`
@Test
void testProcessPayment_success() {
    Order o = new Order(); o.setStatus(OrderStatus.PENDING);
    o.setTotal(BigDecimal.valueOf(50));
    when(paymentGateway.charge(any())).thenReturn(PaymentResult.success("txn1"));
    PaymentResult r = service.processPayment(o);
    assertTrue(r.isSuccess());
    assertEquals(OrderStatus.PAID, o.getStatus());
}`) },
      ],
    },
    {
      id: 'tc-003', name: 'PaymentServiceTest', targetClass: 'PaymentService',
      lineCoverage: 72.8, branchCoverage: 55.4, mutationScore: 48.0,
      methods: [
        { name: 'testCharge_success', targetMethod: 'charge', status: 'passed', duration: 110,
          assertion: 'assertEquals(SUCCESS, result.getStatus())',
          body: j(`
@Test
void testCharge_success() {
    PaymentRequest req = validRequest();
    when(stripe.charge(any())).thenReturn(StripeResponse.success("ch_1"));
    ChargeResult r = service.charge(req);
    assertEquals(ChargeStatus.SUCCESS, r.getStatus());
}`) },
        { name: 'testRefund_fullAmount', targetMethod: 'refund', status: 'passed', duration: 80,
          assertion: 'assertTrue(result.isRefunded())',
          body: j(`
@Test
void testRefund_fullAmount() {
    Transaction t = new Transaction("txn1", BigDecimal.valueOf(100));
    when(txnRepo.findById("txn1")).thenReturn(Optional.of(t));
    when(stripe.refund(eq("txn1"), any())).thenReturn(StripeResponse.success("re_1"));
    RefundResult r = service.refund("txn1", BigDecimal.valueOf(100));
    assertTrue(r.isRefunded());
}`) },
        { name: 'testValidateCard_invalidNumber', targetMethod: 'validateCard', status: 'error', duration: 30,
          assertion: 'NullPointerException at line 42',
          body: j(`
@Test
void testValidateCard_invalidNumber() {
    CardInfo card = new CardInfo();
    card.setNumber(null); // triggers NPE in regex matcher path
    assertFalse(service.validateCard(card));
}
// Error: NullPointerException at PaymentService.validateCard line 42`) },
      ],
    },
    {
      id: 'tc-004', name: 'InventoryServiceTest', targetClass: 'InventoryService',
      lineCoverage: 88.0, branchCoverage: 76.0, mutationScore: 68.5,
      methods: [
        { name: 'testCheckStock_available', targetMethod: 'checkStock', status: 'passed', duration: 12,
          assertion: 'assertEquals(50, stock)',
          body: j(`
@Test
void testCheckStock_available() {
    when(stockRepo.findBySku("SKU1")).thenReturn(Optional.of(new Stock("SKU1", 50)));
    assertEquals(50, service.checkStock("SKU1"));
}`) },
        { name: 'testReserveStock_sufficient', targetMethod: 'reserveStock', status: 'passed', duration: 45,
          assertion: 'assertTrue(reserved)',
          body: j(`
@Test
void testReserveStock_sufficient() {
    Stock s = new Stock("SKU1", 10);
    when(stockRepo.findBySku("SKU1")).thenReturn(Optional.of(s));
    assertTrue(service.reserveStock("SKU1", 5));
    assertEquals(5, s.getQty());
}`) },
        { name: 'testGetLowStockItems', targetMethod: 'getLowStockItems', status: 'passed', duration: 22,
          assertion: 'assertEquals(3, items.size())',
          body: j(`
@Test
void testGetLowStockItems() {
    when(stockRepo.findAll()).thenReturn(List.of(
        new Stock("A", 1, 5),
        new Stock("B", 2, 5),
        new Stock("C", 3, 5),
        new Stock("D", 10, 5)));
    assertEquals(3, service.getLowStockItems().size());
}`) },
      ],
    },
    {
      id: 'tc-005', name: 'ShippingCalculatorTest', targetClass: 'ShippingCalculator',
      lineCoverage: 65.0, branchCoverage: 50.0, mutationScore: 42.0,
      methods: [
        { name: 'testCalculateCost_domestic', targetMethod: 'calculateCost', status: 'passed', duration: 55,
          assertion: 'assertEquals(BigDecimal.valueOf(15.00), cost)',
          body: j(`
@Test
void testCalculateCost_domestic() {
    Address a = us("10001"); Address b = us("90001");
    when(geo.distance(a, b)).thenReturn(100.0);
    BigDecimal cost = calc.calculateCost(a, b, 5.0);
    assertTrue(cost.compareTo(BigDecimal.ZERO) > 0);
}`) },
        { name: 'testValidateAddress_invalid', targetMethod: 'validateAddress', status: 'failed', duration: 35,
          assertion: 'assertFalse(valid) // got true',
          body: j(`
@Test
void testValidateAddress_invalid() {
    Address a = new Address();
    a.setStreet("1 Main"); a.setCity("X");
    a.setCountry("US"); a.setZipCode("BAD");
    assertFalse(calc.validateAddress(a));
}
// Failure: expected <false> but got <true>`) },
      ],
    },
    {
      id: 'tc-006', name: 'NotificationServiceTest', targetClass: 'NotificationService',
      lineCoverage: 70.0, branchCoverage: 58.0, mutationScore: 52.0,
      methods: [
        { name: 'testSendEmail_success', targetMethod: 'sendEmail', status: 'passed', duration: 65,
          assertion: 'verify(mailer).send(any())',
          body: j(`
@Test
void testSendEmail_success() {
    when(templateEngine.render(eq("welcome"), anyMap())).thenReturn("Hi");
    service.sendEmail("a@b.com", "welcome", Map.of("subject", "Hello"));
    verify(mailer).send(any(EmailMessage.class));
}`) },
        { name: 'testSendSms_success', targetMethod: 'sendSms', status: 'passed', duration: 45,
          assertion: 'verify(smsClient).send(phone, message)',
          body: j(`
@Test
void testSendSms_success() {
    service.sendSms("5551234", "hi");
    verify(smsClient).send("+15551234", "hi");
}`) },
        { name: 'testGetPreferences', targetMethod: 'getPreferences', status: 'passed', duration: 20,
          assertion: 'assertTrue(prefs.isEmailEnabled())',
          body: j(`
@Test
void testGetPreferences() {
    when(prefsRepo.findByUserId(1L)).thenReturn(Optional.empty());
    assertTrue(service.getPreferences(1L).isEmailEnabled());
}`) },
      ],
    },
  ],
};

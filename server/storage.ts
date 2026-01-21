import { 
  users, stations, products, tanks, customers, suppliers, salesTransactions, salesTransactionItems,
  purchaseOrders, purchaseOrderItems, expenses, payments, stockMovements, priceHistory, settings,
  pumps, pumpReadings, tankReadings, accounts, journalEntries, journalLines,
  type User, type InsertUser, type Station, type InsertStation, type Product, type InsertProduct,
  type Tank, type InsertTank, type Customer, type InsertCustomer, type Supplier, type InsertSupplier,
  type SalesTransaction, type InsertSalesTransaction, type SalesTransactionItem, type InsertSalesTransactionItem,
  type PurchaseOrder, type InsertPurchaseOrder, type PurchaseOrderItem, type InsertPurchaseOrderItem,
  type Expense, type InsertExpense, type Payment, type InsertPayment, type StockMovement, type InsertStockMovement,
  type PriceHistory, type InsertPriceHistory, type Pump, type InsertPump, type PumpReading, type InsertPumpReading,
  type TankReading, type InsertTankReading, type Settings, type InsertSettings,
  type Account, type InsertAccount, type JournalEntry, type InsertJournalEntry, type JournalLine, type InsertJournalLine
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sum, count, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Station operations
  getStation(id: string): Promise<Station | undefined>;
  getStations(): Promise<Station[]>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: string, station: Partial<Station>): Promise<Station>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Tank operations
  getTanks(stationId: string): Promise<Tank[]>;
  getTanksByStation(stationId: string): Promise<Tank[]>;
  getTank(id: string): Promise<Tank | undefined>;
  createTank(tank: InsertTank): Promise<Tank>;
  updateTankStock(id: string, quantity: string): Promise<Tank>;

  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomerBalance(id: string, amount: string): Promise<Customer>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;

  // Transaction operations
  createSalesTransaction(transaction: InsertSalesTransaction, items: InsertSalesTransactionItem[]): Promise<SalesTransaction>;
  getSalesTransactions(stationId: string, limit?: number): Promise<SalesTransaction[]>;
  getSalesTransaction(id: string): Promise<SalesTransaction | undefined>;
  getSalesTransactionItems(transactionId: string): Promise<SalesTransactionItem[]>;
  getSalesTransactionWithItems(id: string): Promise<(SalesTransaction & { items: (SalesTransactionItem & { product: Product })[], customer: Customer, station: Station, user: User }) | undefined>;
  updateSalesTransaction(id: string, transaction: Partial<SalesTransaction>): Promise<SalesTransaction>;
  deleteSalesTransactionSecure(id: string, stationId: string, role: string): Promise<void>;
  getDashboardStats(stationId: string): Promise<any>;
  createSalesTransactionItem(item: InsertSalesTransactionItem): Promise<SalesTransactionItem>;

  // Purchase operations
  createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  getPurchaseOrders(stationId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  getPurchaseOrderItems(orderId: string): Promise<PurchaseOrderItem[]>;
  getPurchaseOrderWithItems(id: string): Promise<(PurchaseOrder & { items: PurchaseOrderItem[], supplier: Supplier, station: Station }) | undefined>;
  deletePurchaseOrderSecure(id: string, stationId: string, role: string): Promise<void>;

  // Pump operations
  getPumps(stationId: string): Promise<Pump[]>;
  getPumpsByStation(stationId: string): Promise<Pump[]>;
  updatePump(id: string, pump: Partial<Pump>): Promise<Pump>;
  deletePump(id: string): Promise<void>;
  createPump(pump: InsertPump): Promise<Pump>;
  getPumpReadings(stationId: string): Promise<PumpReading[]>;
  getPumpReadingsByStation(stationId: string): Promise<PumpReading[]>;
  createPumpReading(reading: InsertPumpReading): Promise<PumpReading>;

  // Settings
  getSettings(stationId: string): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(stationId: string, settings: Partial<Settings>): Promise<Settings>;

  // Stock movements
  getStockMovements(tankId: string): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Payments
  getPayments(stationId: string): Promise<Payment[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  db: typeof db;

  constructor() {
    this.db = db;
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(insertUser as any).returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await this.db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async getStation(id: string): Promise<Station | undefined> {
    const [station] = await this.db.select().from(stations).where(eq(stations.id, id));
    return station;
  }

  async getStations(): Promise<Station[]> {
    return await this.db.select().from(stations);
  }

  async createStation(insertStation: InsertStation): Promise<Station> {
    const [station] = await this.db.insert(stations).values(insertStation as any).returning();
    return station;
  }

  async updateStation(id: string, stationData: Partial<Station>): Promise<Station> {
    const [station] = await this.db.update(stations).set(stationData).where(eq(stations.id, id)).returning();
    return station;
  }

  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await this.db.insert(products).values(insertProduct as any).returning();
    return product;
  }

  async updateProduct(id: string, productData: Partial<Product>): Promise<Product> {
    const [product] = await this.db.update(products).set(productData).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  async getTanks(stationId: string): Promise<Tank[]> {
    return await this.db.select().from(tanks).where(eq(tanks.stationId, stationId));
  }

  async getTanksByStation(stationId: string): Promise<Tank[]> {
    return await this.getTanks(stationId);
  }

  async getTank(id: string): Promise<Tank | undefined> {
    const [tank] = await this.db.select().from(tanks).where(eq(tanks.id, id));
    return tank;
  }

  async createTank(insertTank: InsertTank): Promise<Tank> {
    const [tank] = await this.db.insert(tanks).values(insertTank as any).returning();
    return tank;
  }

  async updateTankStock(id: string, quantity: string): Promise<Tank> {
    const [tank] = await this.db.update(tanks).set({ currentStock: quantity }).where(eq(tanks.id, id)).returning();
    return tank;
  }

  async getCustomers(): Promise<Customer[]> {
    return await this.db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await this.db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await this.db.insert(customers).values(insertCustomer as any).returning();
    return customer;
  }

  async updateCustomerBalance(id: string, amount: string): Promise<Customer> {
    const [customer] = await this.db.update(customers).set({ outstandingAmount: amount }).where(eq(customers.id, id)).returning();
    return customer;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return await this.db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await this.db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const [supplier] = await this.db.insert(suppliers).values(insertSupplier as any).returning();
    return supplier;
  }

  async createSalesTransaction(insertTransaction: any, items: any[]): Promise<SalesTransaction> {
    return await this.db.transaction(async (tx) => {
      // Create transaction record
      const [transaction] = await tx.insert(salesTransactions).values(insertTransaction).returning();
      
      // Handle items
      const itemsList = Array.isArray(items) ? items : [];
      for (const item of itemsList) {
        await tx.insert(salesTransactionItems).values({ ...item, transactionId: transaction.id });
      }
      
      return transaction;
    });
  }

  async getSalesTransactions(stationId: string, limit?: number): Promise<SalesTransaction[]> {
    let query = this.db.select().from(salesTransactions).where(eq(salesTransactions.stationId, stationId)).orderBy(desc(salesTransactions.transactionDate));
    if (limit) {
      query = (query as any).limit(limit);
    }
    return await query;
  }

  async getSalesTransaction(id: string): Promise<SalesTransaction | undefined> {
    const [transaction] = await this.db.select().from(salesTransactions).where(eq(salesTransactions.id, id));
    return transaction;
  }

  async getSalesTransactionItems(transactionId: string): Promise<SalesTransactionItem[]> {
    return await this.db.select().from(salesTransactionItems).where(eq(salesTransactionItems.transactionId, transactionId));
  }

  async createSalesTransactionItem(item: any): Promise<SalesTransactionItem> {
    const [newItem] = await this.db.insert(salesTransactionItems).values(item).returning();
    return newItem;
  }

  async updateSalesTransaction(id: string, transaction: Partial<SalesTransaction>): Promise<SalesTransaction> {
    const [updated] = await this.db.update(salesTransactions).set(transaction).where(eq(salesTransactions.id, id)).returning();
    return updated;
  }

  async deleteSalesTransactionSecure(id: string, stationId: string, role: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      if (role !== 'admin') {
        const [sale] = await tx.select().from(salesTransactions).where(and(eq(salesTransactions.id, id), eq(salesTransactions.stationId, stationId)));
        if (!sale) throw new Error("Unauthorized to delete this transaction");
      }
      await tx.delete(salesTransactionItems).where(eq(salesTransactionItems.transactionId, id));
      await tx.delete(salesTransactions).where(eq(salesTransactions.id, id));
    });
  }

  async getSalesTransactionWithItems(id: string): Promise<(SalesTransaction & { items: (SalesTransactionItem & { product: Product })[], customer: Customer, station: Station, user: User }) | undefined> {
    const transaction = await this.db.select().from(salesTransactions).leftJoin(customers, eq(salesTransactions.customerId, customers.id)).leftJoin(stations, eq(salesTransactions.stationId, stations.id)).leftJoin(users, eq(salesTransactions.userId, users.id)).where(eq(salesTransactions.id, id)).then(results => results[0]);
    if (!transaction || !transaction.customers || !transaction.stations || !transaction.users) return undefined;
    const items = await this.db.select().from(salesTransactionItems).innerJoin(products, eq(salesTransactionItems.productId, products.id)).where(eq(salesTransactionItems.transactionId, id));
    return { ...transaction.sales_transactions, items: items.map(i => ({ ...i.sales_transaction_items, product: i.products })), customer: transaction.customers, station: transaction.stations, user: transaction.users };
  }

  async createPurchaseOrder(insertOrder: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder> {
    return await this.db.transaction(async (tx) => {
      const [order] = await tx.insert(purchaseOrders).values(insertOrder as any).returning();
      for (const item of items) {
        await tx.insert(purchaseOrderItems).values({ ...item, orderId: order.id } as any);
      }
      return order;
    });
  }

  async getPurchaseOrders(stationId: string): Promise<PurchaseOrder[]> {
    return await this.db.select().from(purchaseOrders).where(eq(purchaseOrders.stationId, stationId)).orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await this.db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }

  async getPurchaseOrderItems(orderId: string): Promise<PurchaseOrderItem[]> {
    return await this.db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, orderId));
  }

  async getPurchaseOrderWithItems(id: string): Promise<(PurchaseOrder & { items: PurchaseOrderItem[], supplier: Supplier, station: Station }) | undefined> {
    const order = await this.db.select().from(purchaseOrders).leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id)).leftJoin(stations, eq(purchaseOrders.stationId, stations.id)).where(eq(purchaseOrders.id, id)).then(results => results[0]);
    if (!order || !order.suppliers || !order.stations) return undefined;
    const items = await this.db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
    return { ...order.purchase_orders, items, supplier: order.suppliers, station: order.stations };
  }

  async deletePurchaseOrderSecure(id: string, stationId: string, role: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      if (role !== 'admin') {
        const [order] = await tx.select().from(purchaseOrders).where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.stationId, stationId)));
        if (!order) throw new Error("Unauthorized to delete this order");
      }
      await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.orderId, id));
      await tx.delete(purchaseOrders).where(eq(purchaseOrders.id, id));
    });
  }

  async getPumps(stationId: string): Promise<Pump[]> {
    return await this.db.select().from(pumps).where(eq(pumps.stationId, stationId));
  }

  async getPumpsByStation(stationId: string): Promise<Pump[]> {
    return await this.getPumps(stationId);
  }

  async updatePump(id: string, pump: Partial<Pump>): Promise<Pump> {
    const [updated] = await this.db.update(pumps).set(pump).where(eq(pumps.id, id)).returning();
    return updated;
  }

  async deletePump(id: string): Promise<void> {
    await this.db.delete(pumps).where(eq(pumps.id, id));
  }

  async createPump(insertPump: InsertPump): Promise<Pump> {
    const [pump] = await this.db.insert(pumps).values(insertPump as any).returning();
    return pump;
  }

  async getPumpReadings(stationId: string): Promise<PumpReading[]> {
    return await this.db.select().from(pumpReadings).where(eq(pumpReadings.stationId, stationId)).orderBy(desc(pumpReadings.readingDate));
  }

  async getPumpReadingsByStation(stationId: string): Promise<PumpReading[]> {
    return await this.getPumpReadings(stationId);
  }

  async createPumpReading(insertReading: InsertPumpReading): Promise<PumpReading> {
    const [reading] = await this.db.insert(pumpReadings).values(insertReading as any).returning();
    return reading;
  }

  async getSettings(stationId: string): Promise<Settings | undefined> {
    const [s] = await this.db.select().from(settings).where(eq(settings.stationId, stationId));
    return s;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [s] = await this.db.insert(settings).values(insertSettings as any).returning();
    return s;
  }

  async updateSettings(stationId: string, settingsData: Partial<Settings>): Promise<Settings> {
    const [s] = await this.db.update(settings).set(settingsData).where(eq(settings.stationId, stationId)).returning();
    return s;
  }

  async getStockMovements(tankId: string): Promise<StockMovement[]> {
    return await this.db.select().from(stockMovements).where(eq(stockMovements.tankId, tankId)).orderBy(desc(stockMovements.movementDate));
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const [m] = await this.db.insert(stockMovements).values(insertMovement as any).returning();
    return m;
  }

  async getPayments(stationId: string): Promise<Payment[]> {
    return await this.db.select().from(payments).where(eq(payments.stationId, stationId)).orderBy(desc(payments.paymentDate));
  }

  async getDashboardStats(stationId: string): Promise<any> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaysSales] = await this.db.select({ totalAmount: sum(salesTransactions.totalAmount), count: sql<number>`count(*)` }).from(salesTransactions).where(and(eq(salesTransactions.stationId, stationId), gte(salesTransactions.transactionDate, today)));
    const [monthlySales] = await this.db.select({ totalAmount: sum(salesTransactions.totalAmount), count: sql<number>`count(*)` }).from(salesTransactions).where(and(eq(salesTransactions.stationId, stationId), gte(salesTransactions.transactionDate, startOfMonth)));
    const [outstanding] = await this.db.select({ totalOutstanding: sum(customers.outstandingAmount) }).from(customers);
    
    // Add counts
    const [customerCount] = await this.db.select({ count: sql<number>`count(*)` }).from(customers);
    const [supplierCount] = await this.db.select({ count: sql<number>`count(*)` }).from(suppliers);

    // Add Payables calculation
    const [payables] = await this.db.select({ 
      totalPayable: sum(purchaseOrders.totalAmount) 
    }).from(purchaseOrders).where(and(eq(purchaseOrders.status, 'pending')));

    // Get recent purchase orders
    const recentPOs = await this.db.select()
      .from(purchaseOrders)
      .orderBy(desc(purchaseOrders.orderDate))
      .limit(5);

    const productSales = await this.db.select({ 
      productId: products.id, 
      productName: products.name, 
      totalAmount: sum(salesTransactionItems.totalPrice), 
      totalQuantity: sum(salesTransactionItems.quantity) 
    })
    .from(salesTransactionItems)
    .innerJoin(products, eq(salesTransactionItems.productId, products.id))
    .innerJoin(salesTransactions, eq(salesTransactionItems.transactionId, salesTransactions.id))
    .where(and(
      gte(salesTransactions.transactionDate, today)
    ))
    .groupBy(products.id, products.name);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const weeklySales = await this.db.select({ 
      dayOfWeek: sql<number>`EXTRACT(DOW FROM ${salesTransactions.transactionDate})`, 
      totalAmount: sum(salesTransactions.totalAmount) 
    })
    .from(salesTransactions)
    .where(and(
      gte(salesTransactions.transactionDate, sevenDaysAgo)
    ))
    .groupBy(sql`EXTRACT(DOW FROM ${salesTransactions.transactionDate})`);

    return {
      todaysSales: { totalAmount: todaysSales?.totalAmount || "0", count: Number(todaysSales?.count || 0) },
      monthlySales: { totalAmount: monthlySales?.totalAmount || "0", count: Number(monthlySales?.count || 0) },
      outstanding: { totalOutstanding: outstanding?.totalOutstanding || "0" },
      payables: { totalPayable: payables?.totalPayable || "0" },
      recentPOs: recentPOs,
      counts: {
        customers: Number(customerCount?.count || 0),
        suppliers: Number(supplierCount?.count || 0),
      },
      weeklySales: weeklySales.map(s => ({ dayOfWeek: Number(s.dayOfWeek), totalAmount: s.totalAmount || "0" })),
      productSales: productSales.map(p => ({ productId: p.productId, productName: p.productName, totalAmount: p.totalAmount || "0", totalQuantity: p.totalQuantity || "0" })),
    };
  }
}

export const storage = new DatabaseStorage();

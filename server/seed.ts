
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, stations, products as productsList, customers, accounts, tanks, pumps, salesTransactions, expenses, payments, purchaseOrders, suppliers, pumpReadings, tankReadings, salesTransactionItems } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { generateId } from "./utils";

export async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Check if data already exists
    const existingUsers = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    if (existingUsers.length > 0) {
      // If admin exists, let's just make sure others exist too or just reset for consistency
      await db.delete(users);
      console.log("Re-seeding users for consistency...");
    }

    // Create default admin user
    const adminUser = await db.insert(users).values({
      id: generateId(),
      username: "admin",
      password: await bcrypt.hash("admin123", 10),
      fullName: "System Administrator",
      role: "admin",
      isActive: true,
    }).returning();

    // Create sample station
    const station = await db.insert(stations).values({
      id: generateId(),
      name: "FuelFlow Demo Station",
      address: "123 Main Street, Demo City",
      contactPhone: "+1-555-0123",
      contactEmail: "demo@fuelflow.com",
      licenseNumber: "FL-2024-001",
      gstNumber: "GST123456789",
      isActive: true,
    }).returning();

    // Create sample manager
    const managerUser = await db.insert(users).values({
      id: generateId(),
      username: "manager1",
      password: await bcrypt.hash("manager123", 10),
      fullName: "Jane Manager",
      role: "manager",
      stationId: station[0].id,
      isActive: true,
    }).returning();

    // Create sample cashier
    const cashierUser = await db.insert(users).values({
      id: generateId(),
      username: "cashier1",
      password: await bcrypt.hash("cashier123", 10),
      fullName: "John Cashier",
      role: "cashier",
      stationId: station[0].id,
      isActive: true,
    }).returning();

    // Update admin with station ID
    await db.update(users).set({ stationId: station[0].id }).where(eq(users.id, adminUser[0].id));

    console.log("👤 Created users");

    console.log("🏪 Created sample station");

    // Create sample products
    const sampleProducts = await db.insert(productsList).values([
      {
        id: generateId(),
        name: "Petrol",
        category: "fuel",
        unit: "litre",
        currentPrice: "285.50",
        density: "0.750",
        hsnCode: "27101290",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Diesel",
        category: "fuel",
        unit: "litre",
        currentPrice: "275.25",
        density: "0.832",
        hsnCode: "27101981",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Engine Oil 20W-50",
        category: "lubricant",
        unit: "bottle",
        currentPrice: "850.00",
        hsnCode: "27101990",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Brake Fluid",
        category: "other",
        unit: "bottle",
        currentPrice: "450.00",
        hsnCode: "38190010",
        isActive: true,
      }
    ]).returning();

    // Create sample customers (15 customers for variety)
    const sampleCustomers = await db.insert(customers).values([
      {
        id: generateId(),
        name: "Walk-in Customer",
        type: "walk-in",
        contactPhone: "",
        contactEmail: "",
        address: "",
        creditLimit: "0",
        outstandingAmount: "0",
        gstNumber: "",
      },
      {
        id: generateId(),
        name: "ABC Transport Ltd.",
        type: "credit",
        contactPhone: "+1-555-1001",
        contactEmail: "accounts@abctransport.com",
        address: "456 Business Park, Demo City",
        creditLimit: "50000",
        outstandingAmount: "15000",
        gstNumber: "GST987654321",
      },
      {
        id: generateId(),
        name: "City Logistics",
        type: "fleet",
        contactPhone: "+1-555-1002",
        contactEmail: "billing@citylogistics.com",
        address: "789 Industrial Area, Demo City",
        creditLimit: "75000",
        outstandingAmount: "25000",
        gstNumber: "GST456789123",
      },
      {
        id: generateId(),
        name: "Express Couriers",
        type: "credit",
        contactPhone: "+1-555-1003",
        contactEmail: "finance@expresscouriers.com",
        address: "321 Commerce St, Demo City",
        creditLimit: "30000",
        outstandingAmount: "12000",
        gstNumber: "GST789123456",
      },
      {
        id: generateId(),
        name: "Metro Bus Services",
        type: "fleet",
        contactPhone: "+1-555-1004",
        contactEmail: "accounts@metrobus.com",
        address: "555 Transit Way, Demo City",
        creditLimit: "100000",
        outstandingAmount: "35000",
        gstNumber: "GST321654987",
      },
      {
        id: generateId(),
        name: "Green Taxi Co.",
        type: "fleet" as const,
        contactPhone: "+1-555-1005",
        contactEmail: "info@greentaxi.com",
        address: "777 Taxi Lane, Demo City",
        creditLimit: "20000",
        outstandingAmount: "0",
        gstNumber: "GST654321789",
      },
      {
        id: generateId(),
        name: "Fast Delivery Inc.",
        type: "credit",
        contactPhone: "+1-555-1006",
        contactEmail: "billing@fastdelivery.com",
        address: "999 Speed Ave, Demo City",
        creditLimit: "40000",
        outstandingAmount: "18000",
        gstNumber: "GST147258369",
      },
      {
        id: generateId(),
        name: "Highway Trucks Ltd.",
        type: "fleet",
        contactPhone: "+1-555-1007",
        contactEmail: "finance@highwaytrucks.com",
        address: "222 Highway Rd, Demo City",
        creditLimit: "80000",
        outstandingAmount: "28000",
        gstNumber: "GST963852741",
      },
      {
        id: generateId(),
        name: "City Cabs",
        type: "fleet" as const,
        contactPhone: "+1-555-1008",
        contactEmail: "accounts@citycabs.com",
        address: "444 Cab Street, Demo City",
        creditLimit: "15000",
        outstandingAmount: "0",
        gstNumber: "GST258147963",
      },
      {
        id: generateId(),
        name: "Premier Transport",
        type: "credit",
        contactPhone: "+1-555-1009",
        contactEmail: "billing@premiertransport.com",
        address: "666 Transport Blvd, Demo City",
        creditLimit: "60000",
        outstandingAmount: "22000",
        gstNumber: "GST741852963",
      }
    ]).returning();

    // Create sample suppliers (10 suppliers)
    const sampleSuppliers = await db.insert(suppliers).values([
      {
        id: generateId(),
        name: "Petro Supply Corp",
        contactPerson: "David Manager",
        contactPhone: "+1-555-2001",
        contactEmail: "orders@petrosupply.com",
        address: "101 Industrial Complex, Supply City",
        paymentTerms: "Net 30",
        outstandingAmount: "125000",
        gstNumber: "GST111222333",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Lubricants Direct",
        contactPerson: "Sarah Sales",
        contactPhone: "+1-555-2002",
        contactEmail: "sales@lubricantsdirect.com",
        address: "202 Commerce Street, Supply City",
        paymentTerms: "Net 15",
        outstandingAmount: "45000",
        gstNumber: "GST444555666",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Global Fuel Distributors",
        contactPerson: "Michael Smith",
        contactPhone: "+1-555-2003",
        contactEmail: "orders@globalfuel.com",
        address: "303 Distribution Ave, Supply City",
        paymentTerms: "Net 30",
        outstandingAmount: "95000",
        gstNumber: "GST777888999",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Premium Oil Suppliers",
        contactPerson: "Jennifer Lee",
        contactPhone: "+1-555-2004",
        contactEmail: "info@premiumoil.com",
        address: "404 Oil Road, Supply City",
        paymentTerms: "Net 45",
        outstandingAmount: "68000",
        gstNumber: "GST123987654",
        isActive: true,
      },
      {
        id: generateId(),
        name: "Auto Parts & Fluids Co.",
        contactPerson: "Robert Johnson",
        contactPhone: "+1-555-2005",
        contactEmail: "sales@autoparts.com",
        address: "505 Parts Lane, Supply City",
        paymentTerms: "Net 30",
        outstandingAmount: "32000",
        gstNumber: "GST456123789",
        isActive: true,
      }
    ]).returning();

    // Create sample accounts for expense management
    const sampleAccounts = await db.insert(accounts).values([
      {
        id: generateId(),
        stationId: station[0].id,
        code: "1001",
        name: "Cash in Hand",
        type: "asset",
        normalBalance: "debit",
        isActive: true,
        isSystem: true,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        code: "5001",
        name: "Electricity Expense",
        type: "expense",
        normalBalance: "debit",
        isActive: true,
        isSystem: false,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        code: "5002",
        name: "Maintenance Expense",
        type: "expense",
        normalBalance: "debit",
        isActive: true,
        isSystem: false,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        code: "5003",
        name: "Office Supplies",
        type: "expense",
        normalBalance: "debit",
        isActive: true,
        isSystem: false,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        code: "5004",
        name: "Salary Expense",
        type: "expense",
        normalBalance: "debit",
        isActive: true,
        isSystem: false,
      }
    ]).returning();

    // Create sample tanks
    const sampleTanks = await db.insert(tanks).values([
      {
        id: generateId(),
        stationId: station[0].id,
        productId: sampleProducts[0].id, // Petrol
        name: "Tank 1 - Petrol",
        capacity: "10000",
        currentStock: "7500",
        minimumLevel: "1000",
      },
      {
        id: generateId(),
        stationId: station[0].id,
        productId: sampleProducts[1].id, // Diesel
        name: "Tank 2 - Diesel",
        capacity: "15000",
        currentStock: "12000",
        minimumLevel: "1500",
      }
    ]).returning();

    // Create sample pumps
    const samplePumps = await db.insert(pumps).values([
      {
        id: generateId(),
        stationId: station[0].id,
        pumpNumber: "P001",
        name: "Pump 1 - Petrol",
        productId: sampleProducts[0].id,
        isActive: true,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        pumpNumber: "P002",
        name: "Pump 2 - Diesel",
        productId: sampleProducts[1].id,
        isActive: true,
      },
      {
        id: generateId(),
        stationId: station[0].id,
        pumpNumber: "P003",
        name: "Pump 3 - Petrol",
        productId: sampleProducts[0].id,
        isActive: true,
      }
    ]).returning();

    console.log("⛽ Created products, tanks, and pumps");

    const now = new Date();

    // Create comprehensive sales transactions for 30 days (5-8 per day)
    const sampleSalesData = [];
    const sampleSalesItemsData = [];
    const stationId = station[0].id;
    let invoiceCounter = 1001;
    const invoicePrefix = `INV-${stationId.slice(-4)}-`;
    
    for (let i = 0; i < 30; i++) {
      const salesPerDay = Math.floor(Math.random() * 4) + 5; // 5-8 sales per day
      for (let j = 0; j < salesPerDay; j++) {
        const transactionDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000 - j * 3600000);
        const randomCustomer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
        const isCredit = randomCustomer.type === "credit" || randomCustomer.type === "fleet";
        
        const transactionId = generateId();
        const randomProduct = sampleProducts[Math.floor(Math.random() * 2)]; // Petrol or Diesel
        const quantity = (Math.random() * 100 + 20).toFixed(3);
        const unitPrice = parseFloat(randomProduct.currentPrice);
        const itemTotal = (parseFloat(quantity) * unitPrice).toFixed(2);
        
        sampleSalesData.push({
          id: transactionId,
          invoiceNumber: `${invoicePrefix}${String(invoiceCounter++).padStart(6, '0')}`,
          stationId: stationId,
          customerId: randomCustomer.id,
          userId: adminUser[0].id,
          transactionDate,
          paymentMethod: isCredit ? "credit" as const : (Math.random() > 0.5 ? "cash" as const : "card" as const),
          currencyCode: "PKR" as const,
          subtotal: itemTotal,
          taxAmount: "0.00",
          totalAmount: itemTotal,
          paidAmount: isCredit ? "0.00" : itemTotal,
          outstandingAmount: isCredit ? itemTotal : "0.00",
        });
        
        sampleSalesItemsData.push({
          id: generateId(),
          transactionId: transactionId,
          productId: randomProduct.id,
          quantity: quantity,
          unitPrice: unitPrice.toFixed(2),
          totalPrice: itemTotal,
        });
      }
    }

    await db.insert(salesTransactions).values(sampleSalesData);
    await db.insert(salesTransactionItems).values(sampleSalesItemsData);
    console.log("💰 Created sales transactions with items");

    // Create comprehensive expenses for 30 days (3-5 per day)
    const expenseCategories = ["utilities", "maintenance", "supplies", "salary", "other"];
    const expenseDescriptions: Record<string, string[]> = {
      utilities: ["Electricity bill", "Water bill", "Internet charges", "Phone bill"],
      maintenance: ["Pump maintenance", "Tank cleaning", "Equipment repair", "Building maintenance"],
      supplies: ["Office supplies", "Cleaning supplies", "Stationery", "Safety equipment"],
      salary: ["Staff salary", "Overtime payment", "Bonus payment"],
      other: ["Miscellaneous expense", "Staff refreshments", "Courier charges", "License renewal"]
    };

    const sampleExpensesData = [];
    let expenseCounter = 1001;
    for (let i = 0; i < 30; i++) {
      const expensesPerDay = Math.floor(Math.random() * 3) + 3; // 3-5 expenses per day
      for (let j = 0; j < expensesPerDay; j++) {
        const expenseDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000 - j * 7200000);
        const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        const descriptions = expenseDescriptions[category];
        const description = descriptions[Math.floor(Math.random() * descriptions.length)];
        const accountIndex = Math.min(Math.floor(Math.random() * 4) + 1, sampleAccounts.length - 1);
        
        sampleExpensesData.push({
          id: generateId(),
          stationId: station[0].id,
          userId: adminUser[0].id,
          accountId: sampleAccounts[accountIndex].id,
          description,
          amount: (Math.random() * 25000 + 2000).toFixed(2),
          category,
          paymentMethod: Math.random() > 0.5 ? "cash" as const : "card" as const,
          expenseDate,
          receiptNumber: `EXP-${String(expenseCounter++).padStart(6, '0')}`,
          vendorName: `Vendor ${Math.floor(Math.random() * 15) + 1}`,
        });
      }
    }

    await db.insert(expenses).values(sampleExpensesData);
    console.log("📊 Created expense records");

    // Create comprehensive payment records (60-80 payments over 30 days)
    const paymentsData = [];
    
    for (let i = 0; i < 75; i++) {
      const paymentDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const isReceivable = Math.random() > 0.5;
      
      if (isReceivable) {
        const customer = sampleCustomers[Math.floor(Math.random() * (sampleCustomers.length - 1)) + 1];
        paymentsData.push({
          id: generateId(),
          stationId: station[0].id,
          userId: adminUser[0].id,
          customerId: customer.id,
          type: "receivable" as const,
          amount: (Math.random() * 35000 + 5000).toFixed(2),
          paymentMethod: Math.random() > 0.5 ? "cash" as const : "card" as const,
          paymentDate,
          currencyCode: "PKR" as const,
          referenceNumber: `RCV-${String(1001 + i).padStart(6, '0')}`,
          notes: `Payment received from ${customer.name}`,
        });
      } else {
        const supplier = sampleSuppliers[Math.floor(Math.random() * sampleSuppliers.length)];
        paymentsData.push({
          id: generateId(),
          stationId: station[0].id,
          userId: adminUser[0].id,
          supplierId: supplier.id,
          type: "payable" as const,
          amount: (Math.random() * 55000 + 15000).toFixed(2),
          paymentMethod: Math.random() > 0.5 ? "cash" as const : "card" as const,
          paymentDate,
          currencyCode: "PKR" as const,
          referenceNumber: `PAY-${String(1001 + i).padStart(6, '0')}`,
          notes: `Payment to ${supplier.name}`,
        });
      }
    }

    await db.insert(payments).values(paymentsData);
    console.log("💳 Created payment records");

    // Create comprehensive purchase orders (50-60 over 30 days)
    const poStatuses = ["pending", "approved", "delivered", "cancelled"];
    const purchaseOrdersData = [];
    
    for (let i = 0; i < 55; i++) {
      const orderDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const supplier = sampleSuppliers[Math.floor(Math.random() * sampleSuppliers.length)];
      const status = poStatuses[Math.floor(Math.random() * poStatuses.length)];
      const subtotal = (Math.random() * 250000 + 75000).toFixed(2);
      
      purchaseOrdersData.push({
        id: generateId(),
        orderNumber: `PO${String(1001 + i).padStart(6, '0')}`,
        stationId: station[0].id,
        supplierId: supplier.id,
        userId: adminUser[0].id,
        orderDate,
        expectedDeliveryDate: new Date(orderDate.getTime() + (7 + Math.floor(Math.random() * 7)) * 24 * 60 * 60 * 1000),
        status,
        currencyCode: "PKR" as const,
        subtotal,
        taxAmount: "0.00",
        totalAmount: subtotal,
        notes: `Supply order for ${supplier.name}`,
      });
    }

    await db.insert(purchaseOrders).values(purchaseOrdersData);
    console.log("📦 Created purchase orders");

    // Create pump readings for 30 days (2-3 readings per pump per day)
    const pumpReadingsData = [];
    
    for (let i = 0; i < 30; i++) {
      const readingDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      for (const pump of samplePumps) {
        const readingsPerDay = Math.floor(Math.random() * 2) + 2;
        for (let j = 0; j < readingsPerDay; j++) {
          const openingReading = 10000 + (i * 1200) + (j * 400) + Math.random() * 200;
          const closingReading = openingReading + 300 + Math.random() * 500;
          
          pumpReadingsData.push({
            id: generateId(),
            stationId: station[0].id,
            pumpId: pump.id,
            productId: pump.productId,
            userId: adminUser[0].id,
            readingDate: new Date(readingDate.getTime() + j * 8 * 60 * 60 * 1000),
            openingReading: openingReading.toFixed(3),
            closingReading: closingReading.toFixed(3),
            totalSale: (closingReading - openingReading).toFixed(3),
            shiftNumber: j === 0 ? "Morning" : j === 1 ? "Evening" : "Night",
            operatorName: `Operator ${(i % 5) + 1}`,
          });
        }
      }
    }
    
    await db.insert(pumpReadings).values(pumpReadingsData);
    console.log("⛽ Created pump readings");

    // Create tank readings for 30 days (1 reading per tank per day)
    const tankReadingsData = [];
    
    for (let i = 0; i < 30; i++) {
      const readingDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      
      for (const tank of sampleTanks) {
        const currentStock = parseFloat(tank.currentStock || "5000") - (i * 150) + Math.random() * 100;
        
        tankReadingsData.push({
          id: generateId(),
          tankId: tank.id,
          productId: tank.productId,
          stationId: station[0].id,
          userId: adminUser[0].id,
          readingDate,
          currentStock: Math.max(1000, currentStock).toFixed(2),
          capacity: tank.capacity,
          minimumLevel: tank.minimumLevel || "500",
          temperature: (25 + Math.random() * 10).toFixed(2),
          waterLevel: (Math.random() * 5).toFixed(2),
        });
      }
    }
    
    await db.insert(tankReadings).values(tankReadingsData);
    console.log("🛢️ Created tank readings");

    console.log("✅ Database seeding completed successfully!");
    console.log("📋 Sample data summary:");
    console.log(`   - Users: 2 (admin, cashier)`);
    console.log(`   - Customers: ${sampleCustomers.length}`);
    console.log(`   - Suppliers: ${sampleSuppliers.length}`);
    console.log(`   - Sales Transactions: ${sampleSalesData.length} (30 days)`);
    console.log(`   - Expenses: ${sampleExpensesData.length} (30 days)`);
    console.log(`   - Payments: ${paymentsData.length} (30 days)`);
    console.log(`   - Purchase Orders: ${purchaseOrdersData.length} (30 days)`);
    console.log(`   - Pump Readings: ${pumpReadingsData.length} (30 days)`);
    console.log(`   - Tank Readings: ${tankReadingsData.length} (30 days)`);
    console.log("   - Admin: username 'admin', password 'admin123'");
    console.log("   - Cashier: username 'cashier1', password 'cashier123'");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

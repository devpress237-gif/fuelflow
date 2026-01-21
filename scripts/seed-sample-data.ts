
import { db } from "../server/db";
import { 
  stations, products, tanks, customers, suppliers, 
  accounts, journalEntries, journalLines, users 
} from "../shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding sample data...");

  // 1. Create a Station
  const [station] = await db.insert(stations).values({
    name: "Main Street Fuel",
    location: "123 Main St, Cityville",
    contactNumber: "555-0199",
    isActive: true
  }).returning();

  // 2. Create Products
  const [petrol] = await db.insert(products).values({
    name: "95 Octane Petrol",
    category: "fuel",
    unit: "L",
    currentPrice: "250.00",
    isActive: true
  }).returning();

  const [diesel] = await db.insert(products).values({
    name: "High Speed Diesel",
    category: "fuel",
    unit: "L",
    currentPrice: "270.00",
    isActive: true
  }).returning();

  // 3. Create Tanks
  await db.insert(tanks).values([
    {
      stationId: station.id,
      productId: petrol.id,
      name: "Tank 1 - Petrol",
      capacity: "10000",
      currentStock: "7500",
      minimumLevel: "1000",
      status: "normal"
    },
    {
      stationId: station.id,
      productId: diesel.id,
      name: "Tank 2 - Diesel",
      capacity: "15000",
      currentStock: "12000",
      minimumLevel: "2000",
      status: "normal"
    }
  ]);

  // 4. Create Customers
  await db.insert(customers).values([
    {
      name: "John Doe",
      type: "regular" as any,
      contactPhone: "555-1111",
      email: "john@example.com",
      outstandingAmount: "0",
      isActive: true,
      stationId: station.id
    },
    {
      name: "City Transport Co",
      type: "credit" as any,
      contactPhone: "555-2222",
      email: "fleet@citytransport.com",
      outstandingAmount: "50000",
      isActive: true,
      stationId: station.id
    }
  ]);

  // 5. Create Suppliers
  await db.insert(suppliers).values([
    {
      name: "National Oil Corp",
      contactName: "Sales Dept",
      contactPhone: "555-9999",
      email: "orders@nationaloil.com",
      outstandingAmount: "0",
      isActive: true,
      stationId: station.id
    }
  ]);

  // 6. Create Ledger Accounts
  const [cashAccount] = await db.insert(accounts).values({
    stationId: station.id,
    code: "1001",
    name: "Cash in Hand",
    type: "asset",
    normalBalance: "debit",
    isActive: true
  }).returning();

  const [salesAccount] = await db.insert(accounts).values({
    stationId: station.id,
    code: "4001",
    name: "Fuel Sales",
    type: "income",
    normalBalance: "credit",
    isActive: true
  }).returning();

  // 7. Create a Sample Journal Entry
  const [entry] = await db.insert(journalEntries).values({
    stationId: station.id,
    entryNumber: "JE-2026-001",
    description: "Initial Cash Sales Record",
    entryDate: new Date().toISOString(),
    sourceType: "sale",
    totalDebit: "1000",
    totalCredit: "1000",
    isPosted: true
  }).returning();

  await db.insert(journalLines).values([
    {
      entryId: entry.id,
      accountId: cashAccount.id,
      debit: "1000",
      credit: "0"
    },
    {
      entryId: entry.id,
      accountId: salesAccount.id,
      debit: "0",
      credit: "1000"
    }
  ]);

  console.log("Seeding completed successfully.");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

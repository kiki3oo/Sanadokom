-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CALL_AGENT',
    "phone" TEXT,
    "commissionFee" REAL NOT NULL DEFAULT 10.0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "webhookSecret" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Drop and recreate Product and Order with new OptiTrav columns
DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "StockMovement";
DROP TABLE IF EXISTS "CallLog";
DROP TABLE IF EXISTS "Order";
DROP TABLE IF EXISTS "Product";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "variant" TEXT,
    "color" TEXT,
    "size" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "costPrice" REAL NOT NULL DEFAULT 0,
    "packagingFee" REAL NOT NULL DEFAULT 5.0,
    "sellingPrice" REAL NOT NULL DEFAULT 0,
    "stockInitial" INTEGER NOT NULL DEFAULT 0,
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "quantitySold" INTEGER NOT NULL DEFAULT 0,
    "alertThreshold" INTEGER NOT NULL DEFAULT 10,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousStock" INTEGER NOT NULL,
    "newStock" INTEGER NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerCity" TEXT NOT NULL,
    "cityApi" TEXT,
    "customerAddress" TEXT NOT NULL,
    "customerNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subStatus" TEXT,
    "isDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "assignedAgentId" TEXT,
    "callAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastCallAt" DATETIME,
    "callbackAt" DATETIME,
    "agentNotes" TEXT,
    "upsell" TEXT,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "costAmount" REAL NOT NULL DEFAULT 0,
    "packagingFee" REAL NOT NULL DEFAULT 0,
    "shippingCost" REAL NOT NULL DEFAULT 35.0,
    "confirmerFee" REAL NOT NULL DEFAULT 10.0,
    "netProfit" REAL NOT NULL DEFAULT 0,
    "courierProvider" TEXT,
    "trackingNumber" TEXT,
    "courierStatus" TEXT,
    "shippedAt" DATETIME,
    "deliveredAt" DATETIME,
    "returnedAt" DATETIME,
    "confirmerPaid" BOOLEAN NOT NULL DEFAULT false,
    "source" TEXT DEFAULT 'Landing Page',
    "utmCampaign" TEXT,
    "utmSource" TEXT,
    "adSet" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Order_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variant" TEXT,
    "color" TEXT,
    "size" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "unitCost" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "agentId" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "callbackAt" DATETIME,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CallLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_slug_key" ON "Store"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Store_webhookSecret_key" ON "Store"("webhookSecret");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");

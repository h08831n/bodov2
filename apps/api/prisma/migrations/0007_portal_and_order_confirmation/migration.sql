-- AlterTable
ALTER TABLE "sale_orders" ADD COLUMN "freight_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
ADD COLUMN "total_weight_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
ADD COLUMN "shipping_address" TEXT,
ADD COLUMN "portal_token" TEXT DEFAULT gen_random_uuid()::text;

-- Populate existing rows with unique portal_tokens if any exist
UPDATE "sale_orders" SET "portal_token" = gen_random_uuid()::text WHERE "portal_token" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sale_orders_portal_token_key" ON "sale_orders"("portal_token");
CREATE INDEX "sale_orders_portal_token_idx" ON "sale_orders"("portal_token");

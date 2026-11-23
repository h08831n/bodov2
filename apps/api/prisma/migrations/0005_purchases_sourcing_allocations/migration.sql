-- CreateEnum
CREATE TYPE "PurchaseOrderStage" AS ENUM ('RFQ', 'RFQ_SENT', 'PURCHASE_ORDER', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('COMMITTED', 'FULFILLED', 'RELEASED');

-- AlterTable
ALTER TABLE "sale_order_lines" ADD COLUMN "allocated_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_no" TEXT NOT NULL,
    "vendor_id" UUID NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "stage" "PurchaseOrderStage" NOT NULL DEFAULT 'RFQ',
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" TIMESTAMPTZ(3),
    "buyer_id" UUID,
    "buyer_name" TEXT,
    "subtotal_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "tax_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "grand_total_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "inquiry_id" UUID,
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" TEXT NOT NULL,
    "mill" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'کیلوگرم',
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unit_price_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "tax_percent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "total_price_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "allocated_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "received_quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_sale_allocations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sale_order_line_id" UUID NOT NULL,
    "purchase_order_line_id" UUID NOT NULL,
    "allocated_quantity" DECIMAL(18,3) NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'COMMITTED',
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "purchase_sale_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_inquiries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiry_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'OPEN',
    "sale_order_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "sourcing_inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sourcing_inquiry_lines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inquiry_id" UUID NOT NULL,
    "product_id" UUID,
    "product_name" TEXT NOT NULL,
    "mill" TEXT NOT NULL DEFAULT '',
    "quantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'کیلوگرم',
    "target_price_toman" DECIMAL(18,0),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sourcing_inquiry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_no_key" ON "purchase_orders"("order_no");
CREATE INDEX "purchase_orders_stage_date_idx" ON "purchase_orders"("stage", "date" DESC);
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_order_lines_order_id_idx" ON "purchase_order_lines"("order_id");

-- CreateIndex
CREATE INDEX "purchase_sale_allocations_sale_order_line_id_idx" ON "purchase_sale_allocations"("sale_order_line_id");
CREATE INDEX "purchase_sale_allocations_purchase_order_line_id_idx" ON "purchase_sale_allocations"("purchase_order_line_id");

-- CreateIndex
CREATE UNIQUE INDEX "sourcing_inquiries_inquiry_no_key" ON "sourcing_inquiries"("inquiry_no");
CREATE INDEX "sourcing_inquiries_stage_idx" ON "sourcing_inquiries"("stage");

-- CreateIndex
CREATE INDEX "sourcing_inquiry_lines_inquiry_id_idx" ON "sourcing_inquiry_lines"("inquiry_id");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "sourcing_inquiries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_sale_allocations" ADD CONSTRAINT "purchase_sale_allocations_sale_order_line_id_fkey" FOREIGN KEY ("sale_order_line_id") REFERENCES "sale_order_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_sale_allocations" ADD CONSTRAINT "purchase_sale_allocations_purchase_order_line_id_fkey" FOREIGN KEY ("purchase_order_line_id") REFERENCES "purchase_order_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sourcing_inquiry_lines" ADD CONSTRAINT "sourcing_inquiry_lines_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "sourcing_inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sourcing_inquiry_lines" ADD CONSTRAINT "sourcing_inquiry_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'TRANSPORTER', 'PARTNER');

-- CreateEnum
CREATE TYPE "ProductCategoryType" AS ENUM ('REBAR', 'BEAM', 'SHEET', 'PROFILE', 'PIPE', 'WIRE', 'OTHER');

-- CreateEnum
CREATE TYPE "SaleOrderStage" AS ENUM ('DRAFT', 'SENT', 'CONFIRMED', 'LOST', 'CANCELLED');

-- CreateTable contacts
CREATE TABLE "contacts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "ContactType" NOT NULL DEFAULT 'CUSTOMER',
    "name" TEXT NOT NULL,
    "company_name" TEXT,
    "national_id" TEXT,
    "economic_code" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "city" TEXT,
    "address" TEXT,
    "balance_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "credit_limit_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable products
CREATE TABLE "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategoryType" NOT NULL DEFAULT 'REBAR',
    "mill" TEXT NOT NULL,
    "standard" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "default_unit" TEXT NOT NULL DEFAULT 'کیلوگرم',
    "allowed_units" JSONB NOT NULL DEFAULT '["کیلوگرم", "شاخه", "بندل"]',
    "price_per_kg_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "stock_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable sale_orders
CREATE TABLE "sale_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quotation_no" TEXT NOT NULL,
    "order_no" TEXT,
    "customer_id" UUID NOT NULL,
    "customer_name" TEXT NOT NULL,
    "stage" "SaleOrderStage" NOT NULL DEFAULT 'DRAFT',
    "date" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMPTZ(3),
    "salesperson_id" UUID,
    "salesperson_name" TEXT,
    "subtotal_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "tax_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "grand_total_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "lost_reason_id" UUID,
    "lost_notes" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "sale_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable sale_order_lines
CREATE TABLE "sale_order_lines" (
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
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_order_lines_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");
CREATE UNIQUE INDEX "sale_orders_quotation_no_key" ON "sale_orders"("quotation_no");
CREATE UNIQUE INDEX "sale_orders_order_no_key" ON "sale_orders"("order_no");

-- Indexes
CREATE INDEX "contacts_type_is_active_idx" ON "contacts"("type", "is_active");
CREATE INDEX "contacts_name_idx" ON "contacts"("name");
CREATE INDEX "contacts_mobile_idx" ON "contacts"("mobile");

CREATE INDEX "products_category_is_active_idx" ON "products"("category", "is_active");
CREATE INDEX "products_mill_idx" ON "products"("mill");

CREATE INDEX "sale_orders_stage_date_idx" ON "sale_orders"("stage", "date" DESC);
CREATE INDEX "sale_orders_customer_id_idx" ON "sale_orders"("customer_id");

CREATE INDEX "sale_order_lines_order_id_idx" ON "sale_order_lines"("order_id");

-- Foreign Keys
ALTER TABLE "sale_orders" ADD CONSTRAINT "sale_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "sale_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_order_lines" ADD CONSTRAINT "sale_order_lines_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

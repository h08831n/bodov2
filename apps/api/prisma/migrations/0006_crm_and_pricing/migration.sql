-- CreateEnum
CREATE TYPE "CrmStage" AS ENUM ('NEW', 'CONTACTED', 'NEEDS_ANALYSIS', 'QUOTED', 'NEGOTIATION', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "contact_id" UUID,
    "contact_name" TEXT NOT NULL,
    "contact_phone" TEXT,
    "stage" "CrmStage" NOT NULL DEFAULT 'NEW',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "expected_revenue_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "expected_weight_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "probability" INTEGER NOT NULL DEFAULT 20,
    "salesperson_id" UUID,
    "salesperson_name" TEXT,
    "lost_reason_id" UUID,
    "lost_notes" TEXT,
    "sale_order_id" UUID,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "close_date" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_prices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "product_id" UUID,
    "product_name" TEXT NOT NULL,
    "category" "ProductCategoryType" NOT NULL DEFAULT 'REBAR',
    "mill" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "standard" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT 'کیلوگرم',
    "price_toman" DECIMAL(18,0) NOT NULL,
    "prev_price_toman" DECIMAL(18,0),
    "price_change_toman" DECIMAL(18,0),
    "published" BOOLEAN NOT NULL DEFAULT true,
    "announced_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "daily_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_leads_stage_created_at_idx" ON "crm_leads"("stage", "created_at" DESC);
CREATE INDEX "crm_leads_contact_id_idx" ON "crm_leads"("contact_id");
CREATE INDEX "crm_leads_salesperson_id_idx" ON "crm_leads"("salesperson_id");

-- CreateIndex
CREATE INDEX "daily_prices_date_category_idx" ON "daily_prices"("date" DESC, "category");
CREATE INDEX "daily_prices_mill_idx" ON "daily_prices"("mill");

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "sale_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_prices" ADD CONSTRAINT "daily_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

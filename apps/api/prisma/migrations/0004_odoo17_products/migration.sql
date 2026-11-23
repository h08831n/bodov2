-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('STORABLE', 'CONSUMABLE', 'SERVICE');

-- CreateEnum
CREATE TYPE "InvoicingPolicy" AS ENUM ('ORDERED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "UomType" AS ENUM ('REFERENCE', 'BIGGER', 'SMALLER');

-- CreateTable uom_categories
CREATE TABLE "uom_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uom_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable uoms
CREATE TABLE "uoms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "uom_type" "UomType" NOT NULL DEFAULT 'REFERENCE',
    "factor" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "rounding" DECIMAL(12,6) NOT NULL DEFAULT 0.001,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_categories
CREATE TABLE "product_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "parent_id" UUID,
    "full_path" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_attributes
CREATE TABLE "product_attributes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "display_type" TEXT NOT NULL DEFAULT 'radio',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_attribute_values
CREATE TABLE "product_attribute_values" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attribute_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_attribute_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_templates
CREATE TABLE "product_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL DEFAULT 'STORABLE',
    "invoicing_policy" "InvoicingPolicy" NOT NULL DEFAULT 'ORDERED',
    "category_id" UUID,
    "default_code" TEXT,
    "barcode" TEXT,
    "sales_price_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "cost_price_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "uom_id" UUID,
    "purchase_uom_id" UUID,
    "can_be_sold" BOOLEAN NOT NULL DEFAULT true,
    "can_be_purchased" BOOLEAN NOT NULL DEFAULT true,
    "description_sale" TEXT,
    "description_purchase" TEXT,
    "internal_notes" TEXT,
    "weight_kg" DECIMAL(12,3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "product_templates_pkey" PRIMARY KEY ("id")
);

-- AlterTable products
ALTER TABLE "products"
    ADD COLUMN "template_id" UUID,
    ADD COLUMN "price_extra_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    ADD COLUMN "stock_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD COLUMN "forecasted_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD COLUMN "sold_qty_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD COLUMN "purchased_qty_kg" DECIMAL(18,3) NOT NULL DEFAULT 0,
    ADD COLUMN "barcode" TEXT;

-- CreateTable product_variant_attribute_values
CREATE TABLE "product_variant_attribute_values" (
    "variant_id" UUID NOT NULL,
    "attribute_value_id" UUID NOT NULL,

    CONSTRAINT "product_variant_attribute_values_pkey" PRIMARY KEY ("variant_id","attribute_value_id")
);

-- CreateTable product_supplier_info
CREATE TABLE "product_supplier_info" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID,
    "variant_id" UUID,
    "vendor_id" UUID NOT NULL,
    "vendor_name" TEXT NOT NULL,
    "vendor_product_code" TEXT,
    "vendor_product_name" TEXT,
    "min_quantity" DECIMAL(18,3) NOT NULL DEFAULT 1,
    "price_toman" DECIMAL(18,0) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'TOMAN',
    "lead_time_days" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_supplier_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uom_categories_name_key" ON "uom_categories"("name");
CREATE UNIQUE INDEX "uoms_category_id_name_key" ON "uoms"("category_id", "name");
CREATE UNIQUE INDEX "product_attributes_name_key" ON "product_attributes"("name");
CREATE UNIQUE INDEX "product_attribute_values_attribute_id_name_key" ON "product_attribute_values"("attribute_id", "name");
CREATE INDEX "product_templates_name_idx" ON "product_templates"("name");
CREATE INDEX "product_templates_default_code_idx" ON "product_templates"("default_code");
CREATE INDEX "product_supplier_info_vendor_id_idx" ON "product_supplier_info"("vendor_id");

-- AddForeignKey
ALTER TABLE "uoms" ADD CONSTRAINT "uoms_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "uom_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "product_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "uoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_templates" ADD CONSTRAINT "product_templates_purchase_uom_id_fkey" FOREIGN KEY ("purchase_uom_id") REFERENCES "uoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "product_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_attribute_values" ADD CONSTRAINT "product_variant_attribute_values_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_variant_attribute_values" ADD CONSTRAINT "product_variant_attribute_values_attribute_value_id_fkey" FOREIGN KEY ("attribute_value_id") REFERENCES "product_attribute_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_supplier_info" ADD CONSTRAINT "product_supplier_info_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "product_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_supplier_info" ADD CONSTRAINT "product_supplier_info_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_supplier_info" ADD CONSTRAINT "product_supplier_info_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

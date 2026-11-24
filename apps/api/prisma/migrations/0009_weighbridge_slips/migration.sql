-- CreateTable
CREATE TABLE "weighbridge_slips" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slip_no" TEXT NOT NULL,
    "sale_order_id" UUID,
    "customer_id" UUID,
    "customer_name" TEXT NOT NULL,
    "net_weight_kg" DECIMAL(18,3) NOT NULL,
    "vehicle_plate" TEXT NOT NULL,
    "waybill_no" TEXT,
    "driver_name" TEXT,
    "driver_mobile" TEXT,
    "scale_name" TEXT,
    "operator_name" TEXT,
    "weighed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "weighbridge_slips_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weighbridge_slips_slip_no_key" ON "weighbridge_slips"("slip_no");

-- CreateIndex
CREATE INDEX "weighbridge_slips_sale_order_id_idx" ON "weighbridge_slips"("sale_order_id");

-- CreateIndex
CREATE INDEX "weighbridge_slips_customer_id_idx" ON "weighbridge_slips"("customer_id");

-- CreateIndex
CREATE INDEX "weighbridge_slips_weighed_at_idx" ON "weighbridge_slips"("weighed_at" DESC);

-- CreateIndex
CREATE INDEX "weighbridge_slips_vehicle_plate_idx" ON "weighbridge_slips"("vehicle_plate");

-- AddForeignKey
ALTER TABLE "weighbridge_slips" ADD CONSTRAINT "weighbridge_slips_sale_order_id_fkey" FOREIGN KEY ("sale_order_id") REFERENCES "sale_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weighbridge_slips" ADD CONSTRAINT "weighbridge_slips_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

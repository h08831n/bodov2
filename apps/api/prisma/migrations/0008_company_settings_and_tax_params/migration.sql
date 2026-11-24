-- AlterTable
ALTER TABLE "company_profile" 
ADD COLUMN "logo_url" TEXT,
ADD COLUMN "bank_name" TEXT,
ADD COLUMN "account_number" TEXT,
ADD COLUMN "iban" TEXT,
ADD COLUMN "default_tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 10,
ADD COLUMN "default_quote_validity_days" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "terms_and_conditions" TEXT;

-- Ensure default initial row exists
INSERT INTO "company_profile" (
    "id",
    "name",
    "legal_name",
    "national_id",
    "economic_code",
    "registration_no",
    "phone",
    "address",
    "postal_code",
    "bank_name",
    "account_number",
    "iban",
    "default_tax_rate",
    "default_quote_validity_days",
    "terms_and_conditions",
    "default_currency_code",
    "updated_at"
) VALUES (
    1,
    'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز',
    'شرکت بازرگانی آهن و مقاطع فولادی پیشتاز پارس (سهامی خاص)',
    '۱۰۱۰۳۸۲۹۱۰۰',
    '۴۱۱۵۶۷۸۹۱۲۳۴',
    '۵۸۴۹۲۰',
    '۰۲۱-۵۴۰۱۹۰۰۰',
    'تهران، بازار آهن شادآباد، مجتمع تجاری ۱۱۰، پلاک ۴۲',
    '۱۳۷۸۹۴۵۶۱۲',
    'بانک ملت - شعبه بازار آهن',
    '۵۸۴۹-۲۰۱۱-۳۳۴۴',
    'IR820120000000005849201133',
    10.00,
    1,
    '۱. وزن نهایی بار پس از باسکول رسمی مبدأ یا مقصد محاسبه و تسویه بر مبنای قبض باسکول معتبر انجام می‌گیرد.\n۲. کرایه حمل طبق بارنامه رسمی باربری بوده و بر عهده خریدار می‌باشد مگر در موارد توافق‌شده.\n۳. تخلیه بار در مقصد بر عهده خریدار است.',
    'IRR',
    NOW()
) ON CONFLICT ("id") DO UPDATE SET
    "bank_name" = EXCLUDED."bank_name",
    "account_number" = EXCLUDED."account_number",
    "iban" = EXCLUDED."iban",
    "default_tax_rate" = EXCLUDED."default_tax_rate",
    "default_quote_validity_days" = EXCLUDED."default_quote_validity_days",
    "terms_and_conditions" = EXCLUDED."terms_and_conditions";

-- AlterTable: add cbseLevel and isPreBuilt to report_card_templates
ALTER TABLE "report_card_templates" ADD COLUMN "cbseLevel" TEXT;
ALTER TABLE "report_card_templates" ADD COLUMN "isPreBuilt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "report_card_templates_cbseLevel_idx" ON "report_card_templates"("cbseLevel");

import { pgTable, uuid, text, timestamp, integer, jsonb, numeric, date } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// Staging CSV Raw - dados brutos do CSV
export const stagingCsvRaw = pgTable('staging_csv_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  rowNumber: integer('row_number').notNull(),
  rawData: jsonb('raw_data').notNull(),
  headers: jsonb('headers'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Staging CSV Processed - dados processados do CSV
export const stagingCsvProcessed = pgTable('staging_csv_processed', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  rowNumber: integer('row_number').notNull(),
  originalData: jsonb('original_data').notNull(),
  mappedData: jsonb('mapped_data').notNull(),
  validationStatus: text('validation_status').default('pending'), // CHECK: 'pending', 'valid', 'invalid', 'warning'
  validationErrors: jsonb('validation_errors').default('[]'),
  validationWarnings: jsonb('validation_warnings').default('[]'),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
});

// Staging Livestock Data - dados de gado
export const stagingLivestockData = pgTable('staging_livestock_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  sourceRowNumber: integer('source_row_number').notNull(),
  animalId: text('animal_id'),
  rfidTag: text('rfid_tag'),
  earTag: text('ear_tag'),
  breed: text('breed'),
  gender: text('gender'),
  birthDate: date('birth_date'),
  weightKg: numeric('weight_kg'),
  location: text('location'),
  status: text('status'),
  ownerName: text('owner_name'),
  dataQualityScore: numeric('data_quality_score').default('1.0'),
  confidenceLevel: text('confidence_level').default('high'), // CHECK: 'low', 'medium', 'high'
  processingNotes: text('processing_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations (vazias por enquanto)
export const stagingCsvRawRelations = relations(stagingCsvRaw, ({}) => ({
  // Relations podem ser adicionadas futuramente
}));

export const stagingCsvProcessedRelations = relations(stagingCsvProcessed, ({}) => ({
  // Relations podem ser adicionadas futuramente
}));

export const stagingLivestockDataRelations = relations(stagingLivestockData, ({}) => ({
  // Relations podem ser adicionadas futuramente
}));

// Zod schemas para validação
export const insertStagingCsvRawSchema = createInsertSchema(stagingCsvRaw);
export const selectStagingCsvRawSchema = createSelectSchema(stagingCsvRaw);

export const insertStagingCsvProcessedSchema = createInsertSchema(stagingCsvProcessed);
export const selectStagingCsvProcessedSchema = createSelectSchema(stagingCsvProcessed);

export const insertStagingLivestockDataSchema = createInsertSchema(stagingLivestockData);
export const selectStagingLivestockDataSchema = createSelectSchema(stagingLivestockData);
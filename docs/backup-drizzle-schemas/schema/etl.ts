import { pgTable, uuid, text, timestamp, bigint, jsonb, serial, numeric, unique, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// ETL Run - cabeçalho do processamento
export const etlRun = pgTable('etl_run', {
  runId: uuid('run_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: text('status').$type<'running' | 'success' | 'failed' | 'cancelled'>().notNull().default('running'),
  startedBy: uuid('started_by'),
  notes: text('notes'),
}, (table) => ({
  // Índices para performance
  orgStartedIdx: index('etl_run_org_started_idx').on(table.organizationId, table.startedAt.desc()),
  statusIdx: index('etl_run_status_idx').on(table.status, table.startedAt.desc()),
  userRunsIdx: index('etl_run_user_idx').on(table.startedBy, table.startedAt.desc()),
}));

// ETL File - manifesto de arquivos no Storage
export const etlFile = pgTable('etl_file', {
  fileId: uuid('file_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  storageBucket: text('storage_bucket').notNull(),
  storagePath: text('storage_path').notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  checksum: text('checksum').notNull(),
  mimeType: text('mime_type'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  status: text('status').$type<'uploaded' | 'parsed' | 'validated' | 'approved' | 'loaded' | 'failed' | 'skipped'>().notNull().default('uploaded'),
  lastError: text('last_error'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
}, (table) => ({
  // Unique constraint para evitar duplicatas
  uniqueFilePerOrg: unique().on(table.organizationId, table.storageBucket, table.storagePath, table.checksum),
  // Índices para performance
  orgStatusIdx: index('etl_file_org_status_idx').on(table.organizationId, table.status, table.uploadedAt.desc()),
  orgUploadedIdx: index('etl_file_org_uploaded_idx').on(table.organizationId, table.uploadedAt.desc()),
  statusProcessedIdx: index('etl_file_status_processed_idx').on(table.status, table.processedAt.desc()),
}));

// ETL Run Log - log detalhado
export const etlRunLog = pgTable('etl_run_log', {
  logId: serial('log_id').primaryKey(),
  runId: uuid('run_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  level: text('level').$type<'INFO' | 'NECESSITA_ACAO' | 'WARN' | 'ERROR'>().notNull().default('INFO'),
  step: text('step'),
  message: text('message').notNull(),
  context: jsonb('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Índices para performance
  runLogIdx: index('etl_run_log_run_idx').on(table.runId, table.createdAt.desc()),
  orgLevelIdx: index('etl_run_log_org_level_idx').on(table.organizationId, table.level, table.createdAt.desc()),
  levelStepIdx: index('etl_run_log_level_step_idx').on(table.level, table.step, table.createdAt.desc()),
}));

// Staging 02 - Desvio Carregamento
export const etlStaging02DesvioCarregamento = pgTable('etl_staging_02_desvio_carregamento', {
  stagingId: uuid('staging_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  rawData: jsonb('raw_data').notNull(),
  dataRef: timestamp('data_ref', { mode: 'date' }),
  turno: text('turno'),
  equipamento: text('equipamento'),
  curralCodigo: text('curral_codigo'),
  dietaNome: text('dieta_nome'),
  kgPlanejado: numeric('kg_planejado'),
  kgReal: numeric('kg_real'),
  desvioKg: numeric('desvio_kg'),
  desvioPct: numeric('desvio_pct'),
  naturalKey: text('natural_key'),
  insertedAt: timestamp('inserted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint para evitar duplicatas por natural key
  uniqueNaturalKeyPerOrg: unique().on(table.organizationId, table.naturalKey),
  // Índices para performance
  orgFileIdx: index('staging_02_org_file_idx').on(table.organizationId, table.fileId),
  orgDataRefIdx: index('staging_02_org_data_ref_idx').on(table.organizationId, table.dataRef.desc()),
  equipamentoIdx: index('staging_02_equipamento_idx').on(table.equipamento, table.dataRef.desc()),
}));

// Staging 04 - Trato por Curral
export const etlStaging04TratoCurral = pgTable('etl_staging_04_trato_curral', {
  stagingId: uuid('staging_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  rawData: jsonb('raw_data').notNull(),
  dataRef: timestamp('data_ref', { mode: 'date' }),
  horaTrato: text('hora_trato'),
  curralCodigo: text('curral_codigo'),
  trateiro: text('trateiro'),
  dietaNome: text('dieta_nome'),
  quantidadeKg: numeric('quantidade_kg'),
  observacoes: text('observacoes'),
  naturalKey: text('natural_key'),
  insertedAt: timestamp('inserted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint para evitar duplicatas por natural key
  uniqueNaturalKeyPerOrg: unique().on(table.organizationId, table.naturalKey),
  // Índices para performance
  orgFileIdx: index('staging_04_org_file_idx').on(table.organizationId, table.fileId),
  orgDataRefIdx: index('staging_04_org_data_ref_idx').on(table.organizationId, table.dataRef.desc()),
  curralHoraIdx: index('staging_04_curral_hora_idx').on(table.curralCodigo, table.horaTrato, table.dataRef.desc()),
  trateiroIdx: index('staging_04_trateiro_idx').on(table.trateiro, table.dataRef.desc()),
}));

// Relations
export const etlRunRelations = relations(etlRun, ({ many }) => ({
  logs: many(etlRunLog),
}));

export const etlFileRelations = relations(etlFile, ({ many }) => ({
  staging02: many(etlStaging02DesvioCarregamento),
  staging04: many(etlStaging04TratoCurral),
}));

export const etlRunLogRelations = relations(etlRunLog, ({ one }) => ({
  run: one(etlRun, {
    fields: [etlRunLog.runId],
    references: [etlRun.runId],
  }),
}));

export const etlStaging02Relations = relations(etlStaging02DesvioCarregamento, ({ one }) => ({
  file: one(etlFile, {
    fields: [etlStaging02DesvioCarregamento.fileId],
    references: [etlFile.fileId],
  }),
}));

export const etlStaging04Relations = relations(etlStaging04TratoCurral, ({ one }) => ({
  file: one(etlFile, {
    fields: [etlStaging04TratoCurral.fileId],
    references: [etlFile.fileId],
  }),
}));

// Zod schemas para validação
export const insertEtlRunSchema = createInsertSchema(etlRun);
export const selectEtlRunSchema = createSelectSchema(etlRun);

export const insertEtlFileSchema = createInsertSchema(etlFile);
export const selectEtlFileSchema = createSelectSchema(etlFile);

export const insertEtlRunLogSchema = createInsertSchema(etlRunLog);
export const selectEtlRunLogSchema = createSelectSchema(etlRunLog);

export const insertEtlStaging02Schema = createInsertSchema(etlStaging02DesvioCarregamento);
export const selectEtlStaging02Schema = createSelectSchema(etlStaging02DesvioCarregamento);

export const insertEtlStaging04Schema = createInsertSchema(etlStaging04TratoCurral);
export const selectEtlStaging04Schema = createSelectSchema(etlStaging04TratoCurral);
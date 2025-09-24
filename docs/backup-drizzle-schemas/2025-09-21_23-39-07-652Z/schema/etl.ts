import { pgTable, text, timestamp, bigint, jsonb, numeric, integer, uuid, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Enums - correspondem aos tipos customizados do banco real
export const etlStateEnum = pgEnum('etl_state', ['uploaded', 'parsed', 'validated', 'approved', 'loaded', 'failed']);
export const logLevelEnum = pgEnum('log_level', ['info', 'warn', 'error', 'debug']);

// ETL File - manifesto de arquivos com state machine
export const etlFile = pgTable('etl_file', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  filename: text('filename').notNull(),
  filepath: text('filepath').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: text('mime_type').notNull(),
  checksum: text('checksum').notNull(),
  currentState: etlStateEnum('current_state').notNull().default('uploaded'),
  stateHistory: jsonb('state_history').default('[]'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  uploadedBy: text('uploaded_by').notNull(),
  parsedAt: timestamp('parsed_at', { withTimezone: true }),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedBy: text('approved_by'),
  loadedAt: timestamp('loaded_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').default('{}'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lockedBy: text('locked_by'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
});

// ETL Run - execuções de processamento
export const etlRun = pgTable('etl_run', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull(),
  organizationId: text('organization_id').notNull(),
  runNumber: integer('run_number').notNull(),
  currentState: etlStateEnum('current_state').notNull().default('uploaded'),
  stateHistory: jsonb('state_history').default('[]'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  processingBy: text('processing_by'),
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  recordsTotal: integer('records_total'),
  recordsProcessed: integer('records_processed'),
  recordsFailed: integer('records_failed'),
  errorMessage: text('error_message'),
  errorDetails: jsonb('error_details'),
  retryCount: integer('retry_count').notNull().default(0),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lockedBy: text('locked_by'),
  lockedAt: timestamp('locked_at', { withTimezone: true }),
  lockExpiresAt: timestamp('lock_expires_at', { withTimezone: true }),
});

// ETL Run Log - logs detalhados
export const etlRunLog = pgTable('etl_run_log', {
  id: text('id').primaryKey(),
  runId: text('run_id'),
  fileId: text('file_id'),
  organizationId: text('organization_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  level: logLevelEnum('level').notNull().default('info'),
  message: text('message').notNull(),
  details: jsonb('details'),
  state: etlStateEnum('state'),
  previousState: etlStateEnum('previous_state'),
  userId: text('user_id'),
  action: text('action'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ETL Dead Letter Queue - fila de falhas
export const etlDeadLetterQueue = pgTable('etl_dead_letter_queue', {
  id: text('id').primaryKey(),
  runId: text('run_id'),
  fileId: text('file_id'),
  organizationId: text('organization_id').notNull(),
  errorMessage: text('error_message').notNull(),
  errorDetails: jsonb('error_details'),
  maxRetriesExceeded: boolean('max_retries_exceeded').default(false),
  markedForRetry: boolean('marked_for_retry').default(false),
  retryAfter: timestamp('retry_after', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ETL Reprocessing Log - log de reprocessamento
export const etlReprocessingLog = pgTable('etl_reprocessing_log', {
  id: text('id').primaryKey(),
  originalFileId: text('original_file_id'),
  checksum: text('checksum').notNull(),
  organizationId: text('organization_id').notNull(),
  forcedBy: text('forced_by').notNull(),
  reason: text('reason'),
  skipValidation: boolean('skip_validation').default(false),
  newFileId: text('new_file_id'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  success: boolean('success'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Staging 02 - Desvio Carregamento (nomes exatos do banco)
export const staging02DesvioCarregamento = pgTable('staging_02_desvio_carregamento', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  data: text('data'),
  hora: text('hora'),
  pazeiro: text('pazeiro'),
  vagao: text('vagao'),
  dieta: text('dieta'),
  nroCarregamento: text('nro_carregamento'),
  ingrediente: text('ingrediente'),
  tipoIngrediente: text('tipo_ingrediente'),
  realizadoKg: numeric('realizado_kg'),
  previstoKg: numeric('previsto_kg'),
  desvioKg: numeric('desvio_kg'),
  desvioPc: numeric('desvio_pc'),
  status: text('status'), // CHECK constraint: 'VERDE', 'AMARELO', 'VERMELHO'
  merge: text('merge'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Staging 04 - Itens Trato (nomes exatos do banco)
export const staging04ItensTrato = pgTable('staging_04_itens_trato', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  data: text('data'),
  idCarregamentoOriginal: text('id_carregamento_original'),
  hora: text('hora'),
  dieta: text('dieta'),
  carregamento: text('carregamento'),
  ingrediente: text('ingrediente'),
  realizadoKg: numeric('realizado_kg'),
  pazeiro: text('pazeiro'),
  vagao: text('vagao'),
  msDietaPc: numeric('ms_dieta_pc'),
  ndtDietaPc: numeric('ndt_dieta_pc'),
  merge: text('merge'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Zod schemas para validação
export const insertEtlFileSchema = createInsertSchema(etlFile);
export const selectEtlFileSchema = createSelectSchema(etlFile);

export const insertEtlRunSchema = createInsertSchema(etlRun);
export const selectEtlRunSchema = createSelectSchema(etlRun);

export const insertEtlRunLogSchema = createInsertSchema(etlRunLog);
export const selectEtlRunLogSchema = createSelectSchema(etlRunLog);

export const insertEtlDeadLetterQueueSchema = createInsertSchema(etlDeadLetterQueue);
export const selectEtlDeadLetterQueueSchema = createSelectSchema(etlDeadLetterQueue);

export const insertEtlReprocessingLogSchema = createInsertSchema(etlReprocessingLog);
export const selectEtlReprocessingLogSchema = createSelectSchema(etlReprocessingLog);

export const insertStaging02Schema = createInsertSchema(staging02DesvioCarregamento);
export const selectStaging02Schema = createSelectSchema(staging02DesvioCarregamento);

export const insertStaging04Schema = createInsertSchema(staging04ItensTrato);
export const selectStaging04Schema = createSelectSchema(staging04ItensTrato);
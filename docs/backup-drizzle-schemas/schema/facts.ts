import { pgTable, uuid, text, timestamp, numeric, date } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { dimCurral, dimDieta, dimEquipamento } from './dimensions';
import { etlFile } from './etl';

// Fato Desvio Carregamento (Pipeline 02)
export const fatoDesvioCarregamento = pgTable('fato_desvio_carregamento', {
  distribId: uuid('distrib_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  dataRef: date('data_ref').notNull(),
  turno: text('turno'),
  curralId: uuid('curral_id').notNull(),
  dietaId: uuid('dieta_id'),
  equipamentoId: uuid('equipamento_id'),
  kgPlanejado: numeric('kg_planejado'),
  kgReal: numeric('kg_real'),
  desvioKg: numeric('desvio_kg'),
  desvioPct: numeric('desvio_pct'),
  sourceFileId: uuid('source_file_id').notNull(),
  naturalKey: text('natural_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Fato Trato Curral (Pipeline 04)
export const fatoTratoCurral = pgTable('fato_trato_curral', {
  tratoId: uuid('trato_id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  dataRef: date('data_ref').notNull(),
  horaTrato: text('hora_trato'),
  curralId: uuid('curral_id').notNull(),
  dietaId: uuid('dieta_id'),
  trateiro: text('trateiro'),
  quantidadeKg: numeric('quantidade_kg'),
  observacoes: text('observacoes'),
  sourceFileId: uuid('source_file_id').notNull(),
  naturalKey: text('natural_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Relations
export const fatoDesvioCarregamentoRelations = relations(fatoDesvioCarregamento, ({ one }) => ({
  curral: one(dimCurral, {
    fields: [fatoDesvioCarregamento.curralId],
    references: [dimCurral.curralId],
  }),
  dieta: one(dimDieta, {
    fields: [fatoDesvioCarregamento.dietaId],
    references: [dimDieta.dietaId],
  }),
  equipamento: one(dimEquipamento, {
    fields: [fatoDesvioCarregamento.equipamentoId],
    references: [dimEquipamento.equipamentoId],
  }),
  sourceFile: one(etlFile, {
    fields: [fatoDesvioCarregamento.sourceFileId],
    references: [etlFile.fileId],
  }),
}));

export const fatoTratoCurralRelations = relations(fatoTratoCurral, ({ one }) => ({
  curral: one(dimCurral, {
    fields: [fatoTratoCurral.curralId],
    references: [dimCurral.curralId],
  }),
  dieta: one(dimDieta, {
    fields: [fatoTratoCurral.dietaId],
    references: [dimDieta.dietaId],
  }),
  sourceFile: one(etlFile, {
    fields: [fatoTratoCurral.sourceFileId],
    references: [etlFile.fileId],
  }),
}));

// Zod schemas para validação
export const insertFatoDesvioCarregamentoSchema = createInsertSchema(fatoDesvioCarregamento);
export const selectFatoDesvioCarregamentoSchema = createSelectSchema(fatoDesvioCarregamento);

export const insertFatoTratoCurralSchema = createInsertSchema(fatoTratoCurral);
export const selectFatoTratoCurralSchema = createSelectSchema(fatoTratoCurral);
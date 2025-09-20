import { pgTable, uuid, text, timestamp, numeric } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';

// Fato Carregamento - tabela de fatos denormalizada (corresponde ao banco real)
export const fatoCarregamento = pgTable('fato_carregamento', {
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
  status: text('status'),
  merge: text('merge'),
  idCarregamentoOriginal: text('id_carregamento_original'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Relations (vazias por enquanto pois a tabela é denormalizada)
export const fatoCarregamentoRelations = relations(fatoCarregamento, ({}) => ({
  // Sem relations pois a estrutura é denormalizada
}));

// Zod schemas para validação
export const insertFatoCarregamentoSchema = createInsertSchema(fatoCarregamento);
export const selectFatoCarregamentoSchema = createSelectSchema(fatoCarregamento);
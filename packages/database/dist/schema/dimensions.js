import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
// Dimensão Curral
export const dimCurral = pgTable('dim_curral', {
    curralId: uuid('curral_id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    codigo: text('codigo').notNull(),
    nome: text('nome'),
    capacidade: text('capacidade'),
    setor: text('setor'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// Dimensão Dieta
export const dimDieta = pgTable('dim_dieta', {
    dietaId: uuid('dieta_id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    nome: text('nome').notNull(),
    descricao: text('descricao'),
    categoria: text('categoria'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// Dimensão Equipamento
export const dimEquipamento = pgTable('dim_equipamento', {
    equipamentoId: uuid('equipamento_id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    codigo: text('codigo').notNull(),
    nome: text('nome'),
    tipo: text('tipo'), // BAHMAN, SILOKING, etc
    modelo: text('modelo'),
    capacidade: text('capacidade'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
// Relations (temporary empty to avoid TypeScript errors)
export const dimCurralRelations = relations(dimCurral, ({}) => ({
// fatos relacionados serão adicionados conforme implementação
}));
export const dimDietaRelations = relations(dimDieta, ({}) => ({
// fatos relacionados serão adicionados conforme implementação
}));
export const dimEquipamentoRelations = relations(dimEquipamento, ({}) => ({
// fatos relacionados serão adicionados conforme implementação
}));
// Zod schemas para validação
export const insertDimCurralSchema = createInsertSchema(dimCurral);
export const selectDimCurralSchema = createSelectSchema(dimCurral);
export const insertDimDietaSchema = createInsertSchema(dimDieta);
export const selectDimDietaSchema = createSelectSchema(dimDieta);
export const insertDimEquipamentoSchema = createInsertSchema(dimEquipamento);
export const selectDimEquipamentoSchema = createSelectSchema(dimEquipamento);
//# sourceMappingURL=dimensions.js.map
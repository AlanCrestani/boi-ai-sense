import { pgTable, uuid, text, timestamp, numeric, date, integer } from 'drizzle-orm/pg-core';
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
  idCarregamento: text('id_carregamento'), // Corrigir nome da coluna
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Fato Distribuição - tabela de fatos denormalizada
export const fatoDistribuicao = pgTable('fato_distribuicao', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: uuid('file_id').notNull(),
  data: text('data'),
  hora: text('hora'),
  vagao: text('vagao'),
  curral: text('curral'),
  trato: text('trato'),
  tratador: text('tratador'),
  dieta: text('dieta'),
  realizadoKg: numeric('realizado_kg'),
  previstoKg: numeric('previsto_kg'),
  desvioKg: numeric('desvio_kg'),
  desvioPc: numeric('desvio_pc'),
  status: text('status'),
  merge: text('merge'),
  idCarregamento: text('id_carregamento'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Fato Histórico Consumo - tabela de fatos baseada em staging_01_historico_consumo
export const fatoHistoricoConsumo = pgTable('fato_historico_consumo', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  fileId: text('file_id').notNull(),
  data: date('data'),
  curral: text('curral'),
  lote: text('lote'),
  raca: text('raca'),
  sexo: text('sexo'),
  codGrupoGenetico: text('cod_grupo_genetico'),
  grupoGenetico: text('grupo_genetico'),
  setor: text('setor'),
  proprietarioPredominante: text('proprietario_predominante'),
  origemPredominante: text('origem_predominante'),
  tipoAquisicao: text('tipo_aquisicao'),
  dieta: text('dieta'),
  escore: numeric('escore'),
  fatorCorrecaoKg: numeric('fator_correcao_kg'),
  escoreNoturno: numeric('escore_noturno'),
  dataEntrada: date('data_entrada'),
  qtdAnimais: integer('qtd_animais'),
  pesoEntradaKg: numeric('peso_entrada_kg'),
  pesoEstimadoKg: numeric('peso_estimado_kg'),
  diasConfinados: integer('dias_confinados'),
  consumoTotalKgMn: numeric('consumo_total_kg_mn'),
  consumoTotalMs: numeric('consumo_total_ms'),
  msDietaMetaPc: numeric('ms_dieta_meta_pc'),
  msDietaRealPc: numeric('ms_dieta_real_pc'),
  cmsPrevistoKg: numeric('cms_previsto_kg'),
  cmsRealizadoKg: numeric('cms_realizado_kg'),
  cmnPrevistoKg: numeric('cmn_previsto_kg'),
  cmnRealizadoKg: numeric('cmn_realizado_kg'),
  gmdKg: numeric('gmd_kg'),
  cmsReferenciaPcpv: numeric('cms_referencia_pcpv'),
  cmsReferenciaKg: numeric('cms_referencia_kg'),
  cmsRealizadoPcpv: numeric('cms_realizado_pcpv'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Relations (vazias por enquanto pois as tabelas são denormalizadas)
export const fatoCarregamentoRelations = relations(fatoCarregamento, ({}) => ({
  // Sem relations pois a estrutura é denormalizada
}));

export const fatoDistribuicaoRelations = relations(fatoDistribuicao, ({}) => ({
  // Sem relations pois a estrutura é denormalizada
}));

export const fatoHistoricoConsumoRelations = relations(fatoHistoricoConsumo, ({}) => ({
  // Sem relations pois a estrutura é denormalizada
}));

// Zod schemas para validação
export const insertFatoCarregamentoSchema = createInsertSchema(fatoCarregamento);
export const selectFatoCarregamentoSchema = createSelectSchema(fatoCarregamento);

export const insertFatoDistribuicaoSchema = createInsertSchema(fatoDistribuicao);
export const selectFatoDistribuicaoSchema = createSelectSchema(fatoDistribuicao);

export const insertFatoHistoricoConsumoSchema = createInsertSchema(fatoHistoricoConsumo);
export const selectFatoHistoricoConsumoSchema = createSelectSchema(fatoHistoricoConsumo);
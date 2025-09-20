-- Additional performance indexes for ETL and dimensional tables
-- Optimizes common query patterns and join operations

-- Dimension table indexes for fast lookups
CREATE INDEX "dim_curral_org_codigo_idx" ON "dim_curral" USING btree ("organization_id", "codigo");
CREATE INDEX "dim_curral_org_active_idx" ON "dim_curral" USING btree ("organization_id", "is_active");

CREATE INDEX "dim_dieta_org_nome_idx" ON "dim_dieta" USING btree ("organization_id", "nome");
CREATE INDEX "dim_dieta_org_categoria_idx" ON "dim_dieta" USING btree ("organization_id", "categoria", "is_active");

CREATE INDEX "dim_equipamento_org_codigo_idx" ON "dim_equipamento" USING btree ("organization_id", "codigo");
CREATE INDEX "dim_equipamento_org_tipo_idx" ON "dim_equipamento" USING btree ("organization_id", "tipo", "is_active");

-- Fact table indexes for analytics queries
CREATE INDEX "fato_desvio_org_data_ref_idx" ON "fato_desvio_carregamento" USING btree ("organization_id", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_desvio_turno_idx" ON "fato_desvio_carregamento" USING btree ("turno", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_desvio_curral_id_idx" ON "fato_desvio_carregamento" USING btree ("curral_id", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_desvio_equipamento_id_idx" ON "fato_desvio_carregamento" USING btree ("equipamento_id", "data_ref" DESC NULLS LAST);

CREATE INDEX "fato_trato_org_data_ref_idx" ON "fato_trato_curral" USING btree ("organization_id", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_trato_curral_id_idx" ON "fato_trato_curral" USING btree ("curral_id", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_trato_trateiro_idx" ON "fato_trato_curral" USING btree ("trateiro", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_trato_hora_idx" ON "fato_trato_curral" USING btree ("hora_trato", "data_ref" DESC NULLS LAST);

-- Composite indexes for common join patterns
CREATE INDEX "fato_desvio_org_curral_data_idx" ON "fato_desvio_carregamento" USING btree ("organization_id", "curral_id", "data_ref" DESC NULLS LAST);
CREATE INDEX "fato_trato_org_curral_data_idx" ON "fato_trato_curral" USING btree ("organization_id", "curral_id", "data_ref" DESC NULLS LAST);

-- Natural key indexes for fast duplicate detection
CREATE INDEX "fato_desvio_natural_key_idx" ON "fato_desvio_carregamento" USING btree ("natural_key");
CREATE INDEX "fato_trato_natural_key_idx" ON "fato_trato_curral" USING btree ("natural_key");

-- Source file tracking indexes
CREATE INDEX "fato_desvio_source_file_idx" ON "fato_desvio_carregamento" USING btree ("source_file_id");
CREATE INDEX "fato_trato_source_file_idx" ON "fato_trato_curral" USING btree ("source_file_id");

-- Comments for index documentation
COMMENT ON INDEX "dim_curral_org_codigo_idx" IS 'Fast curral lookup by organization and code';
COMMENT ON INDEX "dim_dieta_org_nome_idx" IS 'Fast diet lookup by organization and name';
COMMENT ON INDEX "dim_equipamento_org_codigo_idx" IS 'Fast equipment lookup by organization and code';

COMMENT ON INDEX "fato_desvio_org_data_ref_idx" IS 'Main index for desvio analytics by organization and date';
COMMENT ON INDEX "fato_trato_org_data_ref_idx" IS 'Main index for trato analytics by organization and date';

COMMENT ON INDEX "fato_desvio_org_curral_data_idx" IS 'Composite index for curral-specific desvio analysis';
COMMENT ON INDEX "fato_trato_org_curral_data_idx" IS 'Composite index for curral-specific trato analysis';
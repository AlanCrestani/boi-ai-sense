CREATE TABLE "dim_curral" (
	"curral_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"nome" text,
	"capacidade" text,
	"setor" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dim_dieta" (
	"dieta_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dim_equipamento" (
	"equipamento_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"codigo" text NOT NULL,
	"nome" text,
	"tipo" text,
	"modelo" text,
	"capacidade" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etl_file" (
	"file_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_path" text NOT NULL,
	"size_bytes" bigint,
	"checksum" text NOT NULL,
	"mime_type" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"last_error" text,
	"processed_at" timestamp with time zone,
	CONSTRAINT "etl_file_organization_id_storage_bucket_storage_path_checksum_unique" UNIQUE("organization_id","storage_bucket","storage_path","checksum")
);
--> statement-breakpoint
CREATE TABLE "etl_run" (
	"run_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"started_by" uuid,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "etl_run_log" (
	"log_id" serial PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"level" text DEFAULT 'INFO' NOT NULL,
	"step" text,
	"message" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "etl_staging_02_desvio_carregamento" (
	"staging_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"raw_data" jsonb NOT NULL,
	"data_ref" timestamp,
	"turno" text,
	"equipamento" text,
	"curral_codigo" text,
	"dieta_nome" text,
	"kg_planejado" numeric,
	"kg_real" numeric,
	"desvio_kg" numeric,
	"desvio_pct" numeric,
	"natural_key" text,
	"inserted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "etl_staging_02_desvio_carregamento_organization_id_natural_key_unique" UNIQUE("organization_id","natural_key")
);
--> statement-breakpoint
CREATE TABLE "etl_staging_04_trato_curral" (
	"staging_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"raw_data" jsonb NOT NULL,
	"data_ref" timestamp,
	"hora_trato" text,
	"curral_codigo" text,
	"trateiro" text,
	"dieta_nome" text,
	"quantidade_kg" numeric,
	"observacoes" text,
	"natural_key" text,
	"inserted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "etl_staging_04_trato_curral_organization_id_natural_key_unique" UNIQUE("organization_id","natural_key")
);
--> statement-breakpoint
CREATE TABLE "fato_desvio_carregamento" (
	"distrib_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_ref" date NOT NULL,
	"turno" text,
	"curral_id" uuid NOT NULL,
	"dieta_id" uuid,
	"equipamento_id" uuid,
	"kg_planejado" numeric,
	"kg_real" numeric,
	"desvio_kg" numeric,
	"desvio_pct" numeric,
	"source_file_id" uuid NOT NULL,
	"natural_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fato_trato_curral" (
	"trato_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"data_ref" date NOT NULL,
	"hora_trato" text,
	"curral_id" uuid NOT NULL,
	"dieta_id" uuid,
	"trateiro" text,
	"quantidade_kg" numeric,
	"observacoes" text,
	"source_file_id" uuid NOT NULL,
	"natural_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "etl_file_org_status_idx" ON "etl_file" USING btree ("organization_id","status","uploaded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_file_org_uploaded_idx" ON "etl_file" USING btree ("organization_id","uploaded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_file_status_processed_idx" ON "etl_file" USING btree ("status","processed_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_org_started_idx" ON "etl_run" USING btree ("organization_id","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_status_idx" ON "etl_run" USING btree ("status","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_user_idx" ON "etl_run" USING btree ("started_by","started_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_log_run_idx" ON "etl_run_log" USING btree ("run_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_log_org_level_idx" ON "etl_run_log" USING btree ("organization_id","level","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "etl_run_log_level_step_idx" ON "etl_run_log" USING btree ("level","step","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "staging_02_org_file_idx" ON "etl_staging_02_desvio_carregamento" USING btree ("organization_id","file_id");--> statement-breakpoint
CREATE INDEX "staging_02_org_data_ref_idx" ON "etl_staging_02_desvio_carregamento" USING btree ("organization_id","data_ref" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "staging_02_equipamento_idx" ON "etl_staging_02_desvio_carregamento" USING btree ("equipamento","data_ref" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "staging_04_org_file_idx" ON "etl_staging_04_trato_curral" USING btree ("organization_id","file_id");--> statement-breakpoint
CREATE INDEX "staging_04_org_data_ref_idx" ON "etl_staging_04_trato_curral" USING btree ("organization_id","data_ref" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "staging_04_curral_hora_idx" ON "etl_staging_04_trato_curral" USING btree ("curral_codigo","hora_trato","data_ref" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "staging_04_trateiro_idx" ON "etl_staging_04_trato_curral" USING btree ("trateiro","data_ref" DESC NULLS LAST);
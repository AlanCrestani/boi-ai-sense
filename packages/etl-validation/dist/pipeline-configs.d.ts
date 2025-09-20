/**
 * Pipeline-specific configurations for header mapping
 * Defines field mappings for Pipeline 02 and Pipeline 04
 */
import type { HeaderMappingConfig } from './header-mapping.js';
/**
 * Pipeline 02 - Desvio de Carregamento
 * Fields: data_ref, turno, equipamento, curral_codigo, dieta_nome, kg_planejado, kg_real, desvio_kg, desvio_pct
 */
export declare const pipeline02Config: HeaderMappingConfig;
/**
 * Pipeline 04 - Trato por Curral
 * Fields: data_ref, hora_trato, curral_codigo, trateiro, dieta_nome, quantidade_kg, observacoes
 */
export declare const pipeline04Config: HeaderMappingConfig;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      etl_dead_letter_queue: {
        Row: {
          created_at: string
          error_details: Json | null
          error_message: string
          file_id: string | null
          id: string
          marked_for_retry: boolean | null
          max_retries_exceeded: boolean | null
          organization_id: string
          retry_after: string | null
          run_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          error_message: string
          file_id?: string | null
          id: string
          marked_for_retry?: boolean | null
          max_retries_exceeded?: boolean | null
          organization_id: string
          retry_after?: string | null
          run_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          error_message?: string
          file_id?: string | null
          id?: string
          marked_for_retry?: boolean | null
          max_retries_exceeded?: boolean | null
          organization_id?: string
          retry_after?: string | null
          run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etl_dead_letter_queue_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "etl_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etl_dead_letter_queue_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "etl_run"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_file: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checksum: string
          created_at: string
          current_state: Database["public"]["Enums"]["etl_state"]
          error_message: string | null
          failed_at: string | null
          file_size: number
          filename: string
          filepath: string
          id: string
          loaded_at: string | null
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          mime_type: string
          organization_id: string
          parsed_at: string | null
          state_history: Json | null
          updated_at: string
          uploaded_at: string
          uploaded_by: string
          validated_at: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checksum: string
          created_at?: string
          current_state?: Database["public"]["Enums"]["etl_state"]
          error_message?: string | null
          failed_at?: string | null
          file_size: number
          filename: string
          filepath: string
          id: string
          loaded_at?: string | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          mime_type: string
          organization_id: string
          parsed_at?: string | null
          state_history?: Json | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by: string
          validated_at?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checksum?: string
          created_at?: string
          current_state?: Database["public"]["Enums"]["etl_state"]
          error_message?: string | null
          failed_at?: string | null
          file_size?: number
          filename?: string
          filepath?: string
          id?: string
          loaded_at?: string | null
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          mime_type?: string
          organization_id?: string
          parsed_at?: string | null
          state_history?: Json | null
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string
          validated_at?: string | null
          version?: number
        }
        Relationships: []
      }
      etl_reprocessing_log: {
        Row: {
          checksum: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          forced_by: string
          id: string
          new_file_id: string | null
          organization_id: string
          original_file_id: string | null
          reason: string | null
          skip_validation: boolean | null
          success: boolean | null
          updated_at: string
        }
        Insert: {
          checksum: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          forced_by: string
          id: string
          new_file_id?: string | null
          organization_id: string
          original_file_id?: string | null
          reason?: string | null
          skip_validation?: boolean | null
          success?: boolean | null
          updated_at?: string
        }
        Update: {
          checksum?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          forced_by?: string
          id?: string
          new_file_id?: string | null
          organization_id?: string
          original_file_id?: string | null
          reason?: string | null
          skip_validation?: boolean | null
          success?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etl_reprocessing_log_new_file_id_fkey"
            columns: ["new_file_id"]
            isOneToOne: false
            referencedRelation: "etl_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etl_reprocessing_log_original_file_id_fkey"
            columns: ["original_file_id"]
            isOneToOne: false
            referencedRelation: "etl_file"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_run: {
        Row: {
          completed_at: string | null
          created_at: string
          current_state: Database["public"]["Enums"]["etl_state"]
          error_details: Json | null
          error_message: string | null
          file_id: string
          id: string
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          next_retry_at: string | null
          organization_id: string
          processing_by: string | null
          processing_started_at: string | null
          records_failed: number | null
          records_processed: number | null
          records_total: number | null
          retry_count: number
          run_number: number
          started_at: string
          state_history: Json | null
          updated_at: string
          version: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_state?: Database["public"]["Enums"]["etl_state"]
          error_details?: Json | null
          error_message?: string | null
          file_id: string
          id: string
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          organization_id: string
          processing_by?: string | null
          processing_started_at?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_total?: number | null
          retry_count?: number
          run_number: number
          started_at?: string
          state_history?: Json | null
          updated_at?: string
          version?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_state?: Database["public"]["Enums"]["etl_state"]
          error_details?: Json | null
          error_message?: string | null
          file_id?: string
          id?: string
          lock_expires_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          next_retry_at?: string | null
          organization_id?: string
          processing_by?: string | null
          processing_started_at?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_total?: number | null
          retry_count?: number
          run_number?: number
          started_at?: string
          state_history?: Json | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "etl_run_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "etl_file"
            referencedColumns: ["id"]
          },
        ]
      }
      etl_run_log: {
        Row: {
          action: string | null
          created_at: string
          details: Json | null
          file_id: string | null
          id: string
          level: Database["public"]["Enums"]["log_level"]
          message: string
          organization_id: string
          previous_state: Database["public"]["Enums"]["etl_state"] | null
          run_id: string | null
          state: Database["public"]["Enums"]["etl_state"] | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          details?: Json | null
          file_id?: string | null
          id: string
          level?: Database["public"]["Enums"]["log_level"]
          message: string
          organization_id: string
          previous_state?: Database["public"]["Enums"]["etl_state"] | null
          run_id?: string | null
          state?: Database["public"]["Enums"]["etl_state"] | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          details?: Json | null
          file_id?: string | null
          id?: string
          level?: Database["public"]["Enums"]["log_level"]
          message?: string
          organization_id?: string
          previous_state?: Database["public"]["Enums"]["etl_state"] | null
          run_id?: string | null
          state?: Database["public"]["Enums"]["etl_state"] | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etl_run_log_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "etl_file"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etl_run_log_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "etl_run"
            referencedColumns: ["id"]
          },
        ]
      }
      fato_carregamento: {
        Row: {
          created_at: string | null
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          file_id: string
          hora: string | null
          id: string
          id_carregamento: string | null
          ingrediente: string | null
          merge: string | null
          nro_carregamento: string | null
          organization_id: string
          pazeiro: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tipo_ingrediente: string | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id: string
          hora?: string | null
          id?: string
          id_carregamento?: string | null
          ingrediente?: string | null
          merge?: string | null
          nro_carregamento?: string | null
          organization_id: string
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id?: string
          hora?: string | null
          id?: string
          id_carregamento?: string | null
          ingrediente?: string | null
          merge?: string | null
          nro_carregamento?: string | null
          organization_id?: string
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      fato_distribuicao: {
        Row: {
          created_at: string | null
          curral: string | null
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          file_id: string
          hora: string | null
          id: string
          id_carregamento: string | null
          merge: string | null
          organization_id: string
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tratador: string | null
          trato: string | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          created_at?: string | null
          curral?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id: string
          hora?: string | null
          id?: string
          id_carregamento?: string | null
          merge?: string | null
          organization_id: string
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          created_at?: string | null
          curral?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id?: string
          hora?: string | null
          id?: string
          id_carregamento?: string | null
          merge?: string | null
          organization_id?: string
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["invitation_status"] | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["invitation_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          organization_id: string
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          organization_id: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_02_desvio_carregamento: {
        Row: {
          created_at: string | null
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          file_id: string
          hora: string | null
          id: string
          ingrediente: string | null
          merge: string | null
          nro_carregamento: string | null
          organization_id: string
          pazeiro: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tipo_ingrediente: string | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id: string
          hora?: string | null
          id?: string
          ingrediente?: string | null
          merge?: string | null
          nro_carregamento?: string | null
          organization_id: string
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id?: string
          hora?: string | null
          id?: string
          ingrediente?: string | null
          merge?: string | null
          nro_carregamento?: string | null
          organization_id?: string
          pazeiro?: string | null
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tipo_ingrediente?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      staging_03_desvio_distribuicao: {
        Row: {
          created_at: string | null
          curral: string
          data: string
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          file_id: string | null
          hora: string
          id: number
          merge: string | null
          organization_id: string
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          tratador: string | null
          trato: string | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          created_at?: string | null
          curral: string
          data: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id?: string | null
          hora: string
          id?: number
          merge?: string | null
          organization_id: string
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          created_at?: string | null
          curral?: string
          data?: string
          desvio_kg?: number | null
          desvio_pc?: number | null
          dieta?: string | null
          file_id?: string | null
          hora?: string
          id?: number
          merge?: string | null
          organization_id?: string
          previsto_kg?: number | null
          realizado_kg?: number | null
          status?: string | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      staging_04_itens_trato: {
        Row: {
          carregamento: string | null
          created_at: string | null
          data: string | null
          dieta: string | null
          file_id: string
          hora: string | null
          id: string
          id_carregamento_original: string | null
          ingrediente: string | null
          merge: string | null
          ms_dieta_pc: number | null
          ndt_dieta_pc: number | null
          organization_id: string
          pazeiro: string | null
          realizado_kg: number | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          carregamento?: string | null
          created_at?: string | null
          data?: string | null
          dieta?: string | null
          file_id: string
          hora?: string | null
          id?: string
          id_carregamento_original?: string | null
          ingrediente?: string | null
          merge?: string | null
          ms_dieta_pc?: number | null
          ndt_dieta_pc?: number | null
          organization_id: string
          pazeiro?: string | null
          realizado_kg?: number | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          carregamento?: string | null
          created_at?: string | null
          data?: string | null
          dieta?: string | null
          file_id?: string
          hora?: string | null
          id?: string
          id_carregamento_original?: string | null
          ingrediente?: string | null
          merge?: string | null
          ms_dieta_pc?: number | null
          ndt_dieta_pc?: number | null
          organization_id?: string
          pazeiro?: string | null
          realizado_kg?: number | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      staging_05_trato_por_curral: {
        Row: {
          created_at: string | null
          curral: string
          data: string
          dieta: string | null
          file_id: string | null
          hora: string
          id: number
          id_carregamento: string | null
          lote: string | null
          merge: string | null
          ms_dieta_pc: number | null
          organization_id: string
          realizado_kg: number | null
          tratador: string | null
          trato: string | null
          updated_at: string | null
          vagao: string | null
        }
        Insert: {
          created_at?: string | null
          curral: string
          data: string
          dieta?: string | null
          file_id?: string | null
          hora: string
          id?: number
          id_carregamento?: string | null
          lote?: string | null
          merge?: string | null
          ms_dieta_pc?: number | null
          organization_id: string
          realizado_kg?: number | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Update: {
          created_at?: string | null
          curral?: string
          data?: string
          dieta?: string | null
          file_id?: string | null
          hora?: string
          id?: number
          id_carregamento?: string | null
          lote?: string | null
          merge?: string | null
          ms_dieta_pc?: number | null
          organization_id?: string
          realizado_kg?: number | null
          tratador?: string | null
          trato?: string | null
          updated_at?: string | null
          vagao?: string | null
        }
        Relationships: []
      }
      staging_csv_processed: {
        Row: {
          file_id: string
          id: string
          mapped_data: Json
          organization_id: string
          original_data: Json
          processed_at: string | null
          row_number: number
          validation_errors: Json | null
          validation_status: string | null
          validation_warnings: Json | null
        }
        Insert: {
          file_id: string
          id?: string
          mapped_data: Json
          organization_id: string
          original_data: Json
          processed_at?: string | null
          row_number: number
          validation_errors?: Json | null
          validation_status?: string | null
          validation_warnings?: Json | null
        }
        Update: {
          file_id?: string
          id?: string
          mapped_data?: Json
          organization_id?: string
          original_data?: Json
          processed_at?: string | null
          row_number?: number
          validation_errors?: Json | null
          validation_status?: string | null
          validation_warnings?: Json | null
        }
        Relationships: []
      }
      staging_csv_raw: {
        Row: {
          created_at: string | null
          file_id: string
          headers: Json | null
          id: string
          organization_id: string
          raw_data: Json
          row_number: number
        }
        Insert: {
          created_at?: string | null
          file_id: string
          headers?: Json | null
          id?: string
          organization_id: string
          raw_data: Json
          row_number: number
        }
        Update: {
          created_at?: string | null
          file_id?: string
          headers?: Json | null
          id?: string
          organization_id?: string
          raw_data?: Json
          row_number?: number
        }
        Relationships: []
      }
      staging_livestock_data: {
        Row: {
          animal_id: string | null
          birth_date: string | null
          breed: string | null
          confidence_level: string | null
          created_at: string | null
          data_quality_score: number | null
          ear_tag: string | null
          file_id: string
          gender: string | null
          id: string
          location: string | null
          organization_id: string
          owner_name: string | null
          processing_notes: string | null
          rfid_tag: string | null
          source_row_number: number
          status: string | null
          weight_kg: number | null
        }
        Insert: {
          animal_id?: string | null
          birth_date?: string | null
          breed?: string | null
          confidence_level?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          ear_tag?: string | null
          file_id: string
          gender?: string | null
          id?: string
          location?: string | null
          organization_id: string
          owner_name?: string | null
          processing_notes?: string | null
          rfid_tag?: string | null
          source_row_number: number
          status?: string | null
          weight_kg?: number | null
        }
        Update: {
          animal_id?: string | null
          birth_date?: string | null
          breed?: string | null
          confidence_level?: string | null
          created_at?: string | null
          data_quality_score?: number | null
          ear_tag?: string | null
          file_id?: string
          gender?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          owner_name?: string | null
          processing_notes?: string | null
          rfid_tag?: string | null
          source_row_number?: number
          status?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      etl_active_locks: {
        Row: {
          id: string | null
          is_expired: boolean | null
          lock_duration_seconds: number | null
          lock_expires_at: string | null
          locked_at: string | null
          locked_by: string | null
          table_name: string | null
        }
        Relationships: []
      }
      view_carregamento_dieta: {
        Row: {
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          dieta: string | null
          id_carregamento: string | null
          organization_id: string | null
          previsto_kg: number | null
          realizado_kg: number | null
        }
        Relationships: []
      }
      view_carregamento_eficiencia: {
        Row: {
          carregamento_key: string | null
          classificacao: string | null
          data: string | null
          desvio_total: number | null
          dieta: string | null
          eficiencia_pc: number | null
          hora: string | null
          id_carregamento: string | null
          organization_id: string | null
          previsto_total: number | null
          realizado_total: number | null
          vagao: string | null
        }
        Relationships: []
      }
      view_dieta_resumo: {
        Row: {
          data: string | null
          desvio_kg: number | null
          desvio_percentual: number | null
          dieta: string | null
          organization_id: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          total_ingredientes: number | null
        }
        Relationships: []
      }
      view_eficiencia_diaria: {
        Row: {
          classificacao: string | null
          data: string | null
          desvio_absoluto_total: number | null
          desvio_liquido: number | null
          eficiencia_pc: number | null
          organization_id: string | null
          previsto_total: number | null
          qtd_dietas: number | null
          qtd_operadores: number | null
          qtd_vagoes: number | null
          realizado_total: number | null
          total_carregamentos: number | null
        }
        Relationships: []
      }
      view_horario_performance: {
        Row: {
          classificacao_horario: string | null
          desvio_medio_pc: number | null
          desvio_total: number | null
          hora: string | null
          organization_id: string | null
          qtd_amarelo: number | null
          qtd_carregamentos: number | null
          qtd_verde: number | null
          qtd_vermelho: number | null
          total_realizado: number | null
        }
        Relationships: []
      }
      view_ingrediente_categoria_volume: {
        Row: {
          categoria: string | null
          classificacao_volume: string | null
          data: string | null
          desvio_medio_pc: number | null
          organization_id: string | null
          participacao_categoria_pc: number | null
          previsto_total: number | null
          qtd_ingredientes: number | null
          volume_total: number | null
        }
        Relationships: []
      }
      view_ingrediente_participacao: {
        Row: {
          data: string | null
          ingrediente: string | null
          organization_id: string | null
          participacao_pc: number | null
          ranking_volume: number | null
          tipo_ingrediente: string | null
          volume_realizado: number | null
        }
        Relationships: []
      }
      view_ingrediente_problema: {
        Row: {
          desvio_absoluto_total: number | null
          desvio_medio_absoluto_pc: number | null
          frequencia: number | null
          ingrediente: string | null
          nivel_criticidade: string | null
          organization_id: string | null
          percent_problemas: number | null
          qtd_amarelo: number | null
          qtd_verde: number | null
          qtd_vermelho: number | null
          ranking_desvio: number | null
          tipo_ingrediente: string | null
        }
        Relationships: []
      }
      view_ingrediente_resumo: {
        Row: {
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          ingrediente: string | null
          organization_id: string | null
          previsto_kg: number | null
          realizado_kg: number | null
        }
        Relationships: []
      }
      view_pazeiro_ranking: {
        Row: {
          desvio_medio_pc: number | null
          dias_trabalhados: number | null
          organization_id: string | null
          pazeiro: string | null
          percent_amarelo: number | null
          percent_verde: number | null
          percent_vermelho: number | null
          score_performance: number | null
          total_carregamentos: number | null
          total_previsto_kg: number | null
          total_realizado_kg: number | null
        }
        Relationships: []
      }
      view_pazeiro_resumo: {
        Row: {
          carregamentos_amarelo: number | null
          carregamentos_verde: number | null
          carregamentos_vermelho: number | null
          data: string | null
          desvio_kg: number | null
          desvio_medio_pc: number | null
          desvio_pc: number | null
          organization_id: string | null
          pazeiro: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          total_carregamentos: number | null
          total_dietas: number | null
          total_vagoes: number | null
        }
        Relationships: []
      }
      view_status_performance: {
        Row: {
          data: string | null
          desvio_medio_pc: number | null
          max_desvio_pc: number | null
          min_desvio_pc: number | null
          organization_id: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          status: string | null
          total_carregamentos: number | null
          total_dietas: number | null
        }
        Relationships: []
      }
      view_vagao_resumo: {
        Row: {
          data: string | null
          desvio_kg: number | null
          desvio_pc: number | null
          organization_id: string | null
          previsto_kg: number | null
          realizado_kg: number | null
          total_carregamentos: number | null
          total_dietas: number | null
          vagao: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_manage_organization: {
        Args: { _organization_id: string; _user_id: string }
        Returns: boolean
      }
      cleanup_expired_locks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_locking_stats: {
        Args: { p_table_name: string }
        Returns: Json
      }
      get_next_run_number: {
        Args: { p_file_id: string }
        Returns: number
      }
      get_user_organization: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role_in_org: {
        Args: {
          _organization_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_valid_state_transition: {
        Args: {
          p_from_state: Database["public"]["Enums"]["etl_state"]
          p_to_state: Database["public"]["Enums"]["etl_state"]
        }
        Returns: boolean
      }
      safe_update_with_version: {
        Args: {
          p_expected_version: number
          p_record_id: string
          p_table_name: string
          p_updates: Json
        }
        Returns: Json
      }
      update_multiple_with_lock: {
        Args: { p_updates: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "manager" | "employee" | "viewer"
      etl_state:
        | "uploaded"
        | "parsing"
        | "parsed"
        | "validating"
        | "validated"
        | "awaiting_approval"
        | "approved"
        | "loading"
        | "loaded"
        | "failed"
        | "cancelled"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      log_level: "info" | "warning" | "error" | "debug"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["owner", "admin", "manager", "employee", "viewer"],
      etl_state: [
        "uploaded",
        "parsing",
        "parsed",
        "validating",
        "validated",
        "awaiting_approval",
        "approved",
        "loading",
        "loaded",
        "failed",
        "cancelled",
      ],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      log_level: ["info", "warning", "error", "debug"],
    },
  },
} as const
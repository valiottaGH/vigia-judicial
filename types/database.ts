export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          disclaimer_accepted_at: string | null;
          notifications_email: boolean;
          estudio_nombre: string | null;
          matricula: string | null;
          domicilio_profesional: string | null;
          telefono: string | null;
          ciudad: string | null;
          plan: string;
          subscription_status: string;
          subscription_ends_at: string | null;
          stripe_customer_id: string | null;
          mercadopago_payer_id: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          disclaimer_accepted_at?: string | null;
          notifications_email?: boolean;
          estudio_nombre?: string | null;
          matricula?: string | null;
          domicilio_profesional?: string | null;
          telefono?: string | null;
          ciudad?: string | null;
          plan?: string;
          subscription_status?: string;
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          mercadopago_payer_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          disclaimer_accepted_at?: string | null;
          notifications_email?: boolean;
          estudio_nombre?: string | null;
          matricula?: string | null;
          domicilio_profesional?: string | null;
          telefono?: string | null;
          ciudad?: string | null;
          plan?: string;
          subscription_status?: string;
          subscription_ends_at?: string | null;
          stripe_customer_id?: string | null;
          mercadopago_payer_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expedientes: {
        Row: {
          id: string;
          user_id: string;
          numero: string;
          jurisdiccion: string;
          fuero: string | null;
          caratula: string | null;
          juzgado: string | null;
          cisfe_id: string | null;
          activo: boolean;
          ultima_consulta: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          numero: string;
          jurisdiccion: string;
          fuero?: string | null;
          caratula?: string | null;
          juzgado?: string | null;
          cisfe_id?: string | null;
          activo?: boolean;
          ultima_consulta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          numero?: string;
          jurisdiccion?: string;
          fuero?: string | null;
          caratula?: string | null;
          juzgado?: string | null;
          cisfe_id?: string | null;
          activo?: boolean;
          ultima_consulta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      sisfe_sessions: {
        Row: {
          id: string;
          user_id: string;
          cookies_encrypted: string;
          status: "active" | "expired" | "revoked";
          last_used_at: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cookies_encrypted: string;
          status?: "active" | "expired" | "revoked";
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cookies_encrypted?: string;
          status?: "active" | "expired" | "revoked";
          last_used_at?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      escritos: {
        Row: {
          id: string;
          user_id: string;
          titulo: string;
          tipo: string;
          contenido_html: string;
          estado: "borrador" | "finalizado";
          expediente_id: string | null;
          variables: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          titulo: string;
          tipo: string;
          contenido_html?: string;
          estado?: "borrador" | "finalizado";
          expediente_id?: string | null;
          variables?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          titulo?: string;
          tipo?: string;
          contenido_html?: string;
          estado?: "borrador" | "finalizado";
          expediente_id?: string | null;
          variables?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      partes_expediente: {
        Row: {
          id: string;
          expediente_id: string;
          nombre: string;
          apellido: string;
          rol: "actor" | "demandado" | "tercero" | "organismo";
          domicilio: string | null;
          documento: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          nombre: string;
          apellido?: string;
          rol: "actor" | "demandado" | "tercero" | "organismo";
          domicilio?: string | null;
          documento?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          nombre?: string;
          apellido?: string;
          rol?: "actor" | "demandado" | "tercero" | "organismo";
          domicilio?: string | null;
          documento?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resoluciones: {
        Row: {
          id: string;
          expediente_id: string;
          fecha: string;
          tipo: string;
          texto: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          fecha: string;
          tipo?: string;
          texto: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          fecha?: string;
          tipo?: string;
          texto?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      actuaciones_generadas: {
        Row: {
          id: string;
          expediente_id: string;
          user_id: string;
          tipo_actuacion: string;
          resolucion_id: string | null;
          instruccion: string | null;
          jurisdiccion: string;
          plantilla_key: string;
          zip_path: string;
          zip_url: string | null;
          manifest: Json;
          documentos_count: number;
          source_content_hash: string | null;
          plan_at_generation: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          user_id: string;
          tipo_actuacion: string;
          resolucion_id?: string | null;
          instruccion?: string | null;
          jurisdiccion: string;
          plantilla_key: string;
          zip_path: string;
          zip_url?: string | null;
          manifest?: Json;
          documentos_count?: number;
          source_content_hash?: string | null;
          plan_at_generation?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          user_id?: string;
          tipo_actuacion?: string;
          resolucion_id?: string | null;
          instruccion?: string | null;
          jurisdiccion?: string;
          plantilla_key?: string;
          zip_path?: string;
          zip_url?: string | null;
          manifest?: Json;
          documentos_count?: number;
          source_content_hash?: string | null;
          plan_at_generation?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      expediente_adjuntos: {
        Row: {
          id: string;
          expediente_id: string;
          user_id: string;
          nombre_original: string;
          storage_path: string;
          mime_type: string;
          tamano_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          user_id: string;
          nombre_original: string;
          storage_path: string;
          mime_type: string;
          tamano_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          user_id?: string;
          nombre_original?: string;
          storage_path?: string;
          mime_type?: string;
          tamano_bytes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      analisis_plantillas: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          campos: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          campos?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          campos?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plantillas_cedula_usuario: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          descripcion: string | null;
          storage_path: string;
          nombre_archivo: string;
          mime_type: string;
          tamano_bytes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          descripcion?: string | null;
          storage_path: string;
          nombre_archivo: string;
          mime_type?: string;
          tamano_bytes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          descripcion?: string | null;
          storage_path?: string;
          nombre_archivo?: string;
          mime_type?: string;
          tamano_bytes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documento_analisis: {
        Row: {
          id: string;
          user_id: string;
          nombre: string;
          expediente_id: string | null;
          plantilla_id: string | null;
          plantilla_key: string | null;
          campos: Json;
          adjunto_ids: string[];
          resultado: Json | null;
          estado: "borrador" | "procesando" | "completado" | "error";
          error_mensaje: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nombre: string;
          expediente_id?: string | null;
          plantilla_id?: string | null;
          plantilla_key?: string | null;
          campos?: Json;
          adjunto_ids?: string[];
          resultado?: Json | null;
          estado?: "borrador" | "procesando" | "completado" | "error";
          error_mensaje?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nombre?: string;
          expediente_id?: string | null;
          plantilla_id?: string | null;
          plantilla_key?: string | null;
          campos?: Json;
          adjunto_ids?: string[];
          resultado?: Json | null;
          estado?: "borrador" | "procesando" | "completado" | "error";
          error_mensaje?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_payments: {
        Row: {
          id: string;
          user_id: string;
          plan_id: "pro" | "business";
          amount_ars: number;
          mercadopago_payment_id: string | null;
          mercadopago_preference_id: string | null;
          status: "pending" | "approved" | "rejected" | "cancelled" | "in_process";
          external_reference: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: "pro" | "business";
          amount_ars: number;
          mercadopago_payment_id?: string | null;
          mercadopago_preference_id?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled" | "in_process";
          external_reference: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: "pro" | "business";
          amount_ars?: number;
          mercadopago_payment_id?: string | null;
          mercadopago_preference_id?: string | null;
          status?: "pending" | "approved" | "rejected" | "cancelled" | "in_process";
          external_reference?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      security_audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      api_rate_limits: {
        Row: {
          bucket_key: string;
          hits: number;
          window_start: string;
        };
        Insert: {
          bucket_key: string;
          hits?: number;
          window_start?: string;
        };
        Update: {
          bucket_key?: string;
          hits?: number;
          window_start?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_email_registered: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

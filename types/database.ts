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
          cisfe_id?: string | null;
          activo?: boolean;
          ultima_consulta?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      novedades: {
        Row: {
          id: string;
          expediente_id: string;
          cisfe_novedad_id: string;
          fecha: string;
          tipo: string;
          descripcion: string;
          detalle: Json;
          leida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          cisfe_novedad_id: string;
          fecha: string;
          tipo: string;
          descripcion: string;
          detalle?: Json;
          leida?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          cisfe_novedad_id?: string;
          fecha?: string;
          tipo?: string;
          descripcion?: string;
          detalle?: Json;
          leida?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      consultas_log: {
        Row: {
          id: string;
          expediente_id: string;
          status: "ok" | "error" | "sin_novedades";
          novedades_encontradas: number;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expediente_id: string;
          status: "ok" | "error" | "sin_novedades";
          novedades_encontradas?: number;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expediente_id?: string;
          status?: "ok" | "error" | "sin_novedades";
          novedades_encontradas?: number;
          error_message?: string | null;
          created_at?: string;
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
      notification_log: {
        Row: {
          id: string;
          user_id: string;
          tipo: "novedad" | "sesion_expirada";
          novedades_count: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tipo: "novedad" | "sesion_expirada";
          novedades_count?: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tipo?: "novedad" | "sesion_expirada";
          novedades_count?: number;
          sent_at?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_email_registered: {
        Args: { check_email: string };
        Returns: boolean;
      };
    };
  };
}

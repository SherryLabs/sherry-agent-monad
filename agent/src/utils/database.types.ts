export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          api_url: string | null;
          created_at: string | null;
          email: string | null;
          explanation: string | null;
          id_application: string;
          name: string | null;
          project_name: string | null;
          state: string | null;
          telegram: string | null;
          twitter: string | null;
          updated_at: string | null;
        };
        Insert: {
          api_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          explanation?: string | null;
          id_application?: string;
          name?: string | null;
          project_name?: string | null;
          state?: string | null;
          telegram?: string | null;
          twitter?: string | null;
          updated_at?: string | null;
        };
        Update: {
          api_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          explanation?: string | null;
          id_application?: string;
          name?: string | null;
          project_name?: string | null;
          state?: string | null;
          telegram?: string | null;
          twitter?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

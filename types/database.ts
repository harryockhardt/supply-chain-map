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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      effect_types: {
        Row: {
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          is_active?: boolean
          label: string
          slug: string
          sort_order: number
        }
        Update: {
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      incident_categories: {
        Row: {
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          is_active?: boolean
          label: string
          slug: string
          sort_order: number
        }
        Update: {
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      incident_effects: {
        Row: {
          effect_slug: string
          incident_id: string
        }
        Insert: {
          effect_slug: string
          incident_id: string
        }
        Update: {
          effect_slug?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_effects_effect_slug_fkey"
            columns: ["effect_slug"]
            isOneToOne: false
            referencedRelation: "effect_types"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "incident_effects_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_sources: {
        Row: {
          created_at: string
          id: string
          incident_id: string
          published_at: string | null
          source_name: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          incident_id: string
          published_at?: string | null
          source_name: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          incident_id?: string
          published_at?: string | null
          source_name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_sources_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_transport_modes: {
        Row: {
          incident_id: string
          mode_slug: string
        }
        Insert: {
          incident_id: string
          mode_slug: string
        }
        Update: {
          incident_id?: string
          mode_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_transport_modes_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_transport_modes_mode_slug_fkey"
            columns: ["mode_slug"]
            isOneToOne: false
            referencedRelation: "transport_modes"
            referencedColumns: ["slug"]
          },
        ]
      }
      incidents: {
        Row: {
          category_slug: string
          created_at: string
          current_state_description: string
          deleted_at: string | null
          description: string
          event_start_at: string
          geometry: unknown
          id: string
          impact_description: string
          last_verified_at: string
          owner_id: string
          resolved_at: string | null
          severity: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category_slug: string
          created_at?: string
          current_state_description: string
          deleted_at?: string | null
          description: string
          event_start_at: string
          geometry: unknown
          id?: string
          impact_description: string
          last_verified_at: string
          owner_id?: string
          resolved_at?: string | null
          severity: number
          status: string
          title: string
          updated_at?: string
        }
        Update: {
          category_slug?: string
          created_at?: string
          current_state_description?: string
          deleted_at?: string | null
          description?: string
          event_start_at?: string
          geometry?: unknown
          id?: string
          impact_description?: string
          last_verified_at?: string
          owner_id?: string
          resolved_at?: string | null
          severity?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "incident_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "incidents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      transport_modes: {
        Row: {
          is_active: boolean
          label: string
          slug: string
          sort_order: number
        }
        Insert: {
          is_active?: boolean
          label: string
          slug: string
          sort_order: number
        }
        Update: {
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      remove_incident: { Args: { target_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          cep: string
          city: string
          complement: string | null
          country: string
          created_at: string | null
          district: string
          id: string
          is_default: boolean | null
          name: string
          number: string
          state: string
          street: string
          user_id: string
        }
        Insert: {
          cep: string
          city: string
          complement?: string | null
          country?: string
          created_at?: string | null
          district: string
          id?: string
          is_default?: boolean | null
          name: string
          number: string
          state: string
          street: string
          user_id: string
        }
        Update: {
          cep?: string
          city?: string
          complement?: string | null
          country?: string
          created_at?: string | null
          district?: string
          id?: string
          is_default?: boolean | null
          name?: string
          number?: string
          state?: string
          street?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_providers: {
        Row: {
          api_key_env: string
          created_at: string
          id: string
          is_default: boolean
          model: string
          name: string
          temperature: number
        }
        Insert: {
          api_key_env: string
          created_at?: string
          id?: string
          is_default?: boolean
          model?: string
          name: string
          temperature?: number
        }
        Update: {
          api_key_env?: string
          created_at?: string
          id?: string
          is_default?: boolean
          model?: string
          name?: string
          temperature?: number
        }
        Relationships: []
      }
      conversational_sessions: {
        Row: {
          conversation_json: Json
          created_at: string
          id: string
          recommended_perfumes: Json | null
          session_status: string
          updated_at: string
          user_id: string | null
          user_profile_data: Json | null
        }
        Insert: {
          conversation_json?: Json
          created_at?: string
          id?: string
          recommended_perfumes?: Json | null
          session_status?: string
          updated_at?: string
          user_id?: string | null
          user_profile_data?: Json | null
        }
        Update: {
          conversation_json?: Json
          created_at?: string
          id?: string
          recommended_perfumes?: Json | null
          session_status?: string
          updated_at?: string
          user_id?: string | null
          user_profile_data?: Json | null
        }
        Relationships: []
      }
      inventory_lots: {
        Row: {
          created_at: string | null
          expiry_date: string | null
          id: string
          lot_code: string
          perfume_id: string
          qty_ml: number
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_code: string
          perfume_id: string
          qty_ml?: number
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string
          perfume_id?: string
          qty_ml?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_lots_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes: {
        Row: {
          base_notes: string[] | null
          brand: string
          category: string | null
          created_at: string | null
          description: string | null
          family: string
          gender: string
          heart_notes: string[] | null
          id: string
          image_url: string | null
          name: string
          price_10ml: number | null
          price_5ml: number | null
          price_full: number
          top_notes: string[] | null
        }
        Insert: {
          base_notes?: string[] | null
          brand: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          family: string
          gender: string
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          price_10ml?: number | null
          price_5ml?: number | null
          price_full: number
          top_notes?: string[] | null
        }
        Update: {
          base_notes?: string[] | null
          brand?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          family?: string
          gender?: string
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          price_10ml?: number | null
          price_5ml?: number | null
          price_full?: number
          top_notes?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          points: number | null
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          points?: number | null
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          points?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      recommendation_sessions: {
        Row: {
          ai_provider_id: string
          answers_json: Json
          created_at: string
          id: string
          recommended_json: Json | null
          user_id: string | null
        }
        Insert: {
          ai_provider_id: string
          answers_json: Json
          created_at?: string
          id?: string
          recommended_json?: Json | null
          user_id?: string | null
        }
        Update: {
          ai_provider_id?: string
          answers_json?: Json
          created_at?: string
          id?: string
          recommended_json?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_sessions_ai_provider_id_fkey"
            columns: ["ai_provider_id"]
            isOneToOne: false
            referencedRelation: "ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          change_ml: number
          created_at: string | null
          id: string
          lot_id: string | null
          movement_type: string
          notes: string | null
          perfume_id: string
          related_order_id: string | null
        }
        Insert: {
          change_ml: number
          created_at?: string | null
          id?: string
          lot_id?: string | null
          movement_type: string
          notes?: string | null
          perfume_id: string
          related_order_id?: string | null
        }
        Update: {
          change_ml?: number
          created_at?: string | null
          id?: string
          lot_id?: string | null
          movement_type?: string
          notes?: string | null
          perfume_id?: string
          related_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          location: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          location?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
    },
  },
} as const

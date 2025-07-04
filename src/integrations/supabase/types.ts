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
      access_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: unknown | null
          route: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          route: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: unknown | null
          route?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      cart_items: {
        Row: {
          created_at: string
          id: string
          perfume_id: string
          quantity: number
          size_ml: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          perfume_id: string
          quantity?: number
          size_ml: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          perfume_id?: string
          quantity?: number
          size_ml?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
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
      coupon_redemptions: {
        Row: {
          code: string
          created_at: string
          discount_amount: number
          id: string
          order_id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          discount_amount: number
          id?: string
          order_id: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          discount_amount?: number
          id?: string
          order_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "coupon_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          expires_at: string | null
          is_active: boolean
          max_uses: number | null
          min_order_value: number | null
          type: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          type: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          is_active?: boolean
          max_uses?: number | null
          min_order_value?: number | null
          type?: string
          value?: number
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
      loyalty_tiers: {
        Row: {
          created_at: string
          id: string
          min_points: number
          multiplier: number
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_points?: number
          multiplier?: number
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          min_points?: number
          multiplier?: number
          name?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_drafts: {
        Row: {
          address_id: string | null
          created_at: string
          id: string
          shipping_cost: number | null
          shipping_service: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          id?: string
          shipping_cost?: number | null
          shipping_service?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          id?: string
          shipping_cost?: number | null
          shipping_service?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_drafts_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          perfume_id: string
          quantity: number
          size_ml: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          perfume_id: string
          quantity: number
          size_ml: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          perfume_id?: string
          quantity?: number
          size_ml?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_data: Json
          created_at: string
          id: string
          order_number: string
          payment_method: string
          payment_status: string
          shipping_cost: number
          shipping_deadline: number | null
          shipping_service: string | null
          status: string
          subtotal: number
          total_amount: number
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_data: Json
          created_at?: string
          id?: string
          order_number: string
          payment_method: string
          payment_status?: string
          shipping_cost?: number
          shipping_deadline?: number | null
          shipping_service?: string | null
          status?: string
          subtotal: number
          total_amount: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_data?: Json
          created_at?: string
          id?: string
          order_number?: string
          payment_method?: string
          payment_status?: string
          shipping_cost?: number
          shipping_deadline?: number | null
          shipping_service?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      points_transactions: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          description: string | null
          id: string
          order_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          delta: number
          description?: string | null
          id?: string
          order_id?: string | null
          source: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string | null
          id?: string
          order_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_consents: {
        Row: {
          consent_type: string
          consented: boolean
          created_at: string
          expires_at: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          consented?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          consented?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
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
      reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          perfume_id: string
          qty: number
          size_ml: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          perfume_id: string
          qty: number
          size_ml: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          perfume_id?: string
          qty?: number
          size_ml?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          perfume_id: string
          rating: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          perfume_id: string
          rating: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          perfume_id?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          created_at: string
          estimated_delivery_days: number | null
          id: string
          melhor_envio_cart_id: string | null
          melhor_envio_shipment_id: string | null
          order_id: string
          pdf_url: string | null
          service_name: string | null
          service_price: number | null
          status: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimated_delivery_days?: number | null
          id?: string
          melhor_envio_cart_id?: string | null
          melhor_envio_shipment_id?: string | null
          order_id: string
          pdf_url?: string | null
          service_name?: string | null
          service_price?: number | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimated_delivery_days?: number | null
          id?: string
          melhor_envio_cart_id?: string | null
          melhor_envio_shipment_id?: string | null
          order_id?: string
          pdf_url?: string | null
          service_name?: string | null
          service_price?: number | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      add_points_transaction: {
        Args: {
          user_uuid: string
          points_delta: number
          transaction_source: string
          transaction_description?: string
          related_order_id?: string
        }
        Returns: string
      }
      apply_coupon_to_order: {
        Args: { coupon_code: string; order_uuid: string }
        Returns: boolean
      }
      check_low_stock_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_access_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_available_stock: {
        Args: { perfume_uuid: string; size_ml_param: number }
        Returns: number
      }
      get_user_points_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      hard_delete_user_data: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      log_user_access: {
        Args: {
          user_uuid: string
          access_route: string
          client_ip?: unknown
          client_user_agent?: string
        }
        Returns: string
      }
      trigger_email_notification: {
        Args: { notification_type: string; record_id: string }
        Returns: undefined
      }
      upsert_reservation: {
        Args: {
          perfume_uuid: string
          size_ml_param: number
          qty_param: number
          user_uuid?: string
          expires_minutes?: number
        }
        Returns: string
      }
      user_has_purchased_perfume: {
        Args: { user_uuid: string; perfume_uuid: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: { coupon_code: string; order_total: number; user_uuid: string }
        Returns: Json
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

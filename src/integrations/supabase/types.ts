export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      affiliate_payments: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          payment_reference: string | null
          referral_ids: string[]
        }
        Insert: {
          affiliate_id: string
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          payment_reference?: string | null
          referral_ids: string[]
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
          referral_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payments_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          confirmed_at: string | null
          created_at: string | null
          id: string
          order_id: string | null
          paid_at: string | null
          payment_method: string | null
          payment_notes: string | null
          payment_reference: string | null
          referred_user_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_notes?: string | null
          payment_reference?: string | null
          referred_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string | null
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
          {
            foreignKeyName: "cart_items_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_recovery_attempts: {
        Row: {
          cart_session_id: string | null
          clicked_at: string | null
          conversion_value: number | null
          converted: boolean | null
          discount_code: string | null
          discount_offered: number | null
          id: string
          message: string | null
          metadata: Json | null
          opened_at: string | null
          recovery_type: string
          sent_at: string | null
          subject: string | null
        }
        Insert: {
          cart_session_id?: string | null
          clicked_at?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          discount_code?: string | null
          discount_offered?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recovery_type: string
          sent_at?: string | null
          subject?: string | null
        }
        Update: {
          cart_session_id?: string | null
          clicked_at?: string | null
          conversion_value?: number | null
          converted?: boolean | null
          discount_code?: string | null
          discount_offered?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          opened_at?: string | null
          recovery_type?: string
          sent_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_recovery_attempts_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          abandoned_at: string | null
          abandonment_stage: string | null
          checkout_started_at: string | null
          created_at: string | null
          device_type: string | null
          exit_page: string | null
          first_product_added_at: string | null
          first_reminder_sent: string | null
          id: string
          items_count: number | null
          last_activity: string | null
          payment_attempted_at: string | null
          recovery_discount_sent: string | null
          second_reminder_sent: string | null
          session_id: string | null
          status: string | null
          time_spent_minutes: number | null
          total_value: number | null
          traffic_source: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          abandoned_at?: string | null
          abandonment_stage?: string | null
          checkout_started_at?: string | null
          created_at?: string | null
          device_type?: string | null
          exit_page?: string | null
          first_product_added_at?: string | null
          first_reminder_sent?: string | null
          id?: string
          items_count?: number | null
          last_activity?: string | null
          payment_attempted_at?: string | null
          recovery_discount_sent?: string | null
          second_reminder_sent?: string | null
          session_id?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          total_value?: number | null
          traffic_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          abandoned_at?: string | null
          abandonment_stage?: string | null
          checkout_started_at?: string | null
          created_at?: string | null
          device_type?: string | null
          exit_page?: string | null
          first_product_added_at?: string | null
          first_reminder_sent?: string | null
          id?: string
          items_count?: number | null
          last_activity?: string | null
          payment_attempted_at?: string | null
          recovery_discount_sent?: string | null
          second_reminder_sent?: string | null
          session_id?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          total_value?: number | null
          traffic_source?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      catalog_analytics: {
        Row: {
          created_at: string | null
          filters_used: Json | null
          id: string
          items_clicked: number | null
          page_type: string | null
          referrer: string | null
          results_count: number | null
          search_term: string | null
          session_id: string | null
          sort_by: string | null
          time_spent_seconds: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters_used?: Json | null
          id?: string
          items_clicked?: number | null
          page_type?: string | null
          referrer?: string | null
          results_count?: number | null
          search_term?: string | null
          session_id?: string | null
          sort_by?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters_used?: Json | null
          id?: string
          items_clicked?: number | null
          page_type?: string | null
          referrer?: string | null
          results_count?: number | null
          search_term?: string | null
          session_id?: string | null
          sort_by?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          user_id?: string | null
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
      coupon_user_usage: {
        Row: {
          coupon_code: string
          first_used_at: string | null
          id: string
          last_used_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          coupon_code: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          coupon_code?: string
          first_used_at?: string | null
          id?: string
          last_used_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_user_usage_coupon_code_fkey"
            columns: ["coupon_code"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_categories: string[] | null
          auto_apply: boolean | null
          code: string
          coupon_category: string | null
          created_at: string
          current_uses: number
          expires_at: string | null
          first_purchase_only: boolean | null
          free_shipping: boolean | null
          is_active: boolean
          max_uses: number | null
          maximum_discount_amount: number | null
          min_order_value: number | null
          minimum_quantity: number | null
          stackable: boolean | null
          type: string
          usage_per_user: number | null
          user_restrictions: Json | null
          value: number
        }
        Insert: {
          applicable_categories?: string[] | null
          auto_apply?: boolean | null
          code: string
          coupon_category?: string | null
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          first_purchase_only?: boolean | null
          free_shipping?: boolean | null
          is_active?: boolean
          max_uses?: number | null
          maximum_discount_amount?: number | null
          min_order_value?: number | null
          minimum_quantity?: number | null
          stackable?: boolean | null
          type: string
          usage_per_user?: number | null
          user_restrictions?: Json | null
          value: number
        }
        Update: {
          applicable_categories?: string[] | null
          auto_apply?: boolean | null
          code?: string
          coupon_category?: string | null
          created_at?: string
          current_uses?: number
          expires_at?: string | null
          first_purchase_only?: boolean | null
          free_shipping?: boolean | null
          is_active?: boolean
          max_uses?: number | null
          maximum_discount_amount?: number | null
          min_order_value?: number | null
          minimum_quantity?: number | null
          stackable?: boolean | null
          type?: string
          usage_per_user?: number | null
          user_restrictions?: Json | null
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
            foreignKeyName: "inventory_lots_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
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
          {
            foreignKeyName: "order_items_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
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
      perfume_comparisons: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          perfume_ids: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          perfume_ids: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          perfume_ids?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      perfume_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          metadata: Json | null
          perfume_id: string | null
          position_in_list: number | null
          session_id: string | null
          source_page: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          metadata?: Json | null
          perfume_id?: string | null
          position_in_list?: number | null
          session_id?: string | null
          source_page?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          metadata?: Json | null
          perfume_id?: string | null
          position_in_list?: number | null
          session_id?: string | null
          source_page?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "perfume_interactions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_interactions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      perfume_similarities: {
        Row: {
          behavior_similarity: number | null
          calculation_count: number | null
          combined_score: number | null
          created_at: string | null
          id: string
          last_calculated: string | null
          notes_similarity: number | null
          perfume_a_id: string | null
          perfume_b_id: string | null
          purchase_similarity: number | null
        }
        Insert: {
          behavior_similarity?: number | null
          calculation_count?: number | null
          combined_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          notes_similarity?: number | null
          perfume_a_id?: string | null
          perfume_b_id?: string | null
          purchase_similarity?: number | null
        }
        Update: {
          behavior_similarity?: number | null
          calculation_count?: number | null
          combined_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated?: string | null
          notes_similarity?: number | null
          perfume_a_id?: string | null
          perfume_b_id?: string | null
          purchase_similarity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perfume_similarities_perfume_a_id_fkey"
            columns: ["perfume_a_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_similarities_perfume_a_id_fkey"
            columns: ["perfume_a_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_similarities_perfume_b_id_fkey"
            columns: ["perfume_b_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_similarities_perfume_b_id_fkey"
            columns: ["perfume_b_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
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
      popular_searches: {
        Row: {
          category: string | null
          conversion_rate: number | null
          created_at: string
          id: string
          last_searched: string | null
          query: string
          search_count: number | null
        }
        Insert: {
          category?: string | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          last_searched?: string | null
          query: string
          search_count?: number | null
        }
        Update: {
          category?: string | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          last_searched?: string | null
          query?: string
          search_count?: number | null
        }
        Relationships: []
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
      promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          is_active: boolean
          original_price_10ml: number | null
          original_price_5ml: number | null
          original_price_full: number | null
          perfume_id: string
          promotional_price_10ml: number | null
          promotional_price_5ml: number | null
          promotional_price_full: number | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at: string
          id?: string
          is_active?: boolean
          original_price_10ml?: number | null
          original_price_5ml?: number | null
          original_price_full?: number | null
          perfume_id: string
          promotional_price_10ml?: number | null
          promotional_price_5ml?: number | null
          promotional_price_full?: number | null
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string
          id?: string
          is_active?: boolean
          original_price_10ml?: number | null
          original_price_5ml?: number | null
          original_price_full?: number | null
          perfume_id?: string
          promotional_price_10ml?: number | null
          promotional_price_5ml?: number | null
          promotional_price_full?: number | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "reservations_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpfulness: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpfulness_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          helpful_count: number | null
          id: string
          images_urls: string[] | null
          perfume_id: string
          rating: number
          status: string
          updated_at: string
          user_id: string
          verified_purchase: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images_urls?: string[] | null
          perfume_id: string
          rating: number
          status?: string
          updated_at?: string
          user_id: string
          verified_purchase?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images_urls?: string[] | null
          perfume_id?: string
          rating?: number
          status?: string
          updated_at?: string
          user_id?: string
          verified_purchase?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          clicked_result_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          query: string
          results_count: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          query: string
          results_count?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          query?: string
          results_count?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_suggestions: {
        Row: {
          created_at: string
          id: string
          related_id: string | null
          score: number | null
          suggestion_text: string
          suggestion_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          related_id?: string | null
          score?: number | null
          suggestion_text: string
          suggestion_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          related_id?: string | null
          score?: number | null
          suggestion_text?: string
          suggestion_type?: string
          user_id?: string | null
        }
        Relationships: []
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
      stock_alert_configs: {
        Row: {
          alert_enabled: boolean | null
          auto_reorder: boolean | null
          avg_monthly_sales_ml: number | null
          created_at: string | null
          critical_threshold_ml: number | null
          id: string
          last_sales_calculation: string | null
          low_threshold_ml: number | null
          medium_threshold_ml: number | null
          perfume_id: string | null
          preferred_reorder_quantity: number | null
          updated_at: string | null
        }
        Insert: {
          alert_enabled?: boolean | null
          auto_reorder?: boolean | null
          avg_monthly_sales_ml?: number | null
          created_at?: string | null
          critical_threshold_ml?: number | null
          id?: string
          last_sales_calculation?: string | null
          low_threshold_ml?: number | null
          medium_threshold_ml?: number | null
          perfume_id?: string | null
          preferred_reorder_quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          alert_enabled?: boolean | null
          auto_reorder?: boolean | null
          avg_monthly_sales_ml?: number | null
          created_at?: string | null
          critical_threshold_ml?: number | null
          id?: string
          last_sales_calculation?: string | null
          low_threshold_ml?: number | null
          medium_threshold_ml?: number | null
          perfume_id?: string | null
          preferred_reorder_quantity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alert_configs_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: true
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alert_configs_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: true
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alert_history: {
        Row: {
          admin_notified: boolean | null
          alert_type: string
          auto_reorder_triggered: boolean | null
          created_at: string | null
          days_until_stockout: number | null
          id: string
          notification_sent: boolean | null
          perfume_id: string | null
          stock_ml_at_alert: number | null
          threshold_triggered: number | null
        }
        Insert: {
          admin_notified?: boolean | null
          alert_type: string
          auto_reorder_triggered?: boolean | null
          created_at?: string | null
          days_until_stockout?: number | null
          id?: string
          notification_sent?: boolean | null
          perfume_id?: string | null
          stock_ml_at_alert?: number | null
          threshold_triggered?: number | null
        }
        Update: {
          admin_notified?: boolean | null
          alert_type?: string
          auto_reorder_triggered?: boolean | null
          created_at?: string | null
          days_until_stockout?: number | null
          id?: string
          notification_sent?: boolean | null
          perfume_id?: string | null
          stock_ml_at_alert?: number | null
          threshold_triggered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alert_history_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alert_history_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
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
          {
            foreignKeyName: "stock_movements_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assigned_to: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          feedback: string | null
          id: string
          priority: string
          rating: number | null
          session_id: string | null
          status: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          priority?: string
          rating?: number | null
          session_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          priority?: string
          rating?: number | null
          session_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          conversation_id: string
          created_at: string
          id: string
          message: string
          message_type: string
          read_at: string | null
          sender_id: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type: string
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
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
      wishlist: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          perfume_id: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          perfume_id: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          perfume_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "wishlist_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_promotions: {
        Row: {
          created_at: string | null
          current_price_10ml: number | null
          current_price_5ml: number | null
          current_price_full: number | null
          description: string | null
          discount_type: string | null
          discount_value: number | null
          ends_at: string | null
          id: string | null
          is_active: boolean | null
          original_price_10ml: number | null
          original_price_5ml: number | null
          original_price_full: number | null
          perfume_brand: string | null
          perfume_id: string | null
          perfume_name: string | null
          promotional_price_10ml: number | null
          promotional_price_5ml: number | null
          promotional_price_full: number | null
          starts_at: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes_with_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes_with_stock: {
        Row: {
          base_notes: string[] | null
          brand: string | null
          category: string | null
          created_at: string | null
          description: string | null
          family: string | null
          gender: string | null
          heart_notes: string[] | null
          id: string | null
          image_url: string | null
          last_stock_update: string | null
          name: string | null
          price_10ml: number | null
          price_5ml: number | null
          price_full: number | null
          stock_10ml: number | null
          stock_5ml: number | null
          stock_full: number | null
          stock_status: string | null
          top_notes: string[] | null
          total_stock_ml: number | null
        }
        Relationships: []
      }
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
      calculate_notes_similarity: {
        Args: { perfume_a_id: string; perfume_b_id: string }
        Returns: number
      }
      check_advanced_stock_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          perfume_id: string
          perfume_name: string
          brand: string
          current_stock_ml: number
          alert_level: string
          days_until_stockout: number
          should_reorder: boolean
        }[]
      }
      check_low_stock_alerts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      check_perfume_availability: {
        Args: {
          perfume_uuid: string
          size_ml_param: number
          quantity_requested?: number
        }
        Returns: {
          available: boolean
          max_quantity: number
          stock_ml: number
        }[]
      }
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_access_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_cart_recovery_attempt: {
        Args: {
          cart_session_uuid: string
          recovery_type_param: string
          subject_param?: string
          message_param?: string
          discount_offered_param?: number
          discount_code_param?: string
        }
        Returns: string
      }
      detect_abandoned_carts: {
        Args: Record<PropertyKey, never>
        Returns: {
          cart_session_id: string
          user_id: string
          session_id: string
          items_count: number
          total_value: number
          hours_since_abandonment: number
          recommended_action: string
          priority_score: number
        }[]
      }
      generate_affiliate_code: {
        Args: { user_name?: string }
        Returns: string
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_promotion: {
        Args: { perfume_uuid: string }
        Returns: {
          id: string
          title: string
          description: string
          discount_type: string
          discount_value: number
          promotional_price_5ml: number
          promotional_price_10ml: number
          promotional_price_full: number
          ends_at: string
        }[]
      }
      get_active_promotion_optimized: {
        Args: { perfume_uuid: string }
        Returns: {
          id: string
          title: string
          description: string
          discount_type: string
          discount_value: number
          promotional_price_5ml: number
          promotional_price_10ml: number
          promotional_price_full: number
          ends_at: string
          time_remaining: unknown
        }[]
      }
      get_available_stock: {
        Args: { perfume_uuid: string; size_ml_param: number }
        Returns: number
      }
      get_perfume_recommendations: {
        Args: { perfume_uuid: string; limit_count?: number; min_score?: number }
        Returns: {
          perfume_id: string
          name: string
          brand: string
          image_url: string
          price_5ml: number
          price_full: number
          similarity_score: number
          recommendation_reason: string
        }[]
      }
      get_user_points_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_recommendations: {
        Args: { user_uuid?: string; limit_count?: number }
        Returns: {
          perfume_id: string
          name: string
          brand: string
          image_url: string
          price_5ml: number
          price_full: number
          recommendation_score: number
          recommendation_reason: string
        }[]
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
      increment_search_count: {
        Args: { search_query: string }
        Returns: undefined
      }
      log_perfume_interaction: {
        Args: {
          perfume_uuid: string
          interaction_type_param: string
          source_page_param?: string
          position_param?: number
          metadata_param?: Json
        }
        Returns: string
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
      mark_cart_as_abandoned: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      trigger_email_notification: {
        Args: { notification_type: string; record_id: string }
        Returns: undefined
      }
      update_sales_statistics: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      validate_coupon_advanced: {
        Args: {
          coupon_code: string
          order_total: number
          user_uuid: string
          cart_items?: Json
        }
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
      app_role: ["admin", "customer"],
    },
  },
} as const

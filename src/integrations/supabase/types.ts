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
      address_access_log: {
        Row: {
          action: string
          address_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          address_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          address_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
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
      business_data_access_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          table_accessed: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          table_accessed: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          table_accessed?: string
          user_agent?: string | null
          user_id?: string | null
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
      company_info: {
        Row: {
          cep: string
          cidade: string
          cnpj: string
          created_at: string
          email_contato: string
          email_sac: string
          endereco_completo: string
          estado: string
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          razao_social: string
          responsavel_tecnico: string | null
          telefone: string
          updated_at: string
        }
        Insert: {
          cep: string
          cidade: string
          cnpj: string
          created_at?: string
          email_contato: string
          email_sac: string
          endereco_completo: string
          estado: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social: string
          responsavel_tecnico?: string | null
          telefone: string
          updated_at?: string
        }
        Update: {
          cep?: string
          cidade?: string
          cnpj?: string
          created_at?: string
          email_contato?: string
          email_sac?: string
          endereco_completo?: string
          estado?: string
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          responsavel_tecnico?: string | null
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          ambiente_nfe: string
          certificado_a1_base64: string | null
          certificado_senha: string | null
          cnpj: string
          created_at: string
          email: string
          endereco_bairro: string
          endereco_cep: string
          endereco_cidade: string
          endereco_codigo_municipio: string
          endereco_complemento: string | null
          endereco_logradouro: string
          endereco_numero: string
          endereco_uf: string
          focus_nfe_token: string | null
          id: string
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          razao_social: string
          regime_tributario: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ambiente_nfe?: string
          certificado_a1_base64?: string | null
          certificado_senha?: string | null
          cnpj: string
          created_at?: string
          email: string
          endereco_bairro: string
          endereco_cep: string
          endereco_cidade: string
          endereco_codigo_municipio: string
          endereco_complemento?: string | null
          endereco_logradouro: string
          endereco_numero: string
          endereco_uf: string
          focus_nfe_token?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social: string
          regime_tributario?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ambiente_nfe?: string
          certificado_a1_base64?: string | null
          certificado_senha?: string | null
          cnpj?: string
          created_at?: string
          email?: string
          endereco_bairro?: string
          endereco_cep?: string
          endereco_cidade?: string
          endereco_codigo_municipio?: string
          endereco_complemento?: string | null
          endereco_logradouro?: string
          endereco_numero?: string
          endereco_uf?: string
          focus_nfe_token?: string | null
          id?: string
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social?: string
          regime_tributario?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_audit_log: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          legal_basis: string | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
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
          session_id: string | null
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
          session_id?: string | null
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
          session_id?: string | null
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
      fiscal_note_items: {
        Row: {
          cfop: string
          codigo_produto: string
          created_at: string
          descricao: string
          fiscal_note_id: string
          id: string
          ncm: string
          numero_item: number
          order_item_id: string
          quantidade: number
          unidade_comercial: string
          valor_cofins: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          cfop: string
          codigo_produto: string
          created_at?: string
          descricao: string
          fiscal_note_id: string
          id?: string
          ncm: string
          numero_item: number
          order_item_id: string
          quantidade: number
          unidade_comercial?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total: number
          valor_unitario: number
        }
        Update: {
          cfop?: string
          codigo_produto?: string
          created_at?: string
          descricao?: string
          fiscal_note_id?: string
          id?: string
          ncm?: string
          numero_item?: number
          order_item_id?: string
          quantidade?: number
          unidade_comercial?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_note_items_fiscal_note_id_fkey"
            columns: ["fiscal_note_id"]
            isOneToOne: false
            referencedRelation: "fiscal_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_note_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_notes: {
        Row: {
          chave_acesso: string | null
          created_at: string
          data_autorizacao: string | null
          data_emissao: string
          erro_message: string | null
          focus_nfe_ref: string | null
          id: string
          numero: number
          order_id: string
          pdf_url: string | null
          protocolo_autorizacao: string | null
          serie: number
          status: string
          updated_at: string
          valor_cofins: number | null
          valor_icms: number | null
          valor_ipi: number | null
          valor_pis: number | null
          valor_produtos: number
          valor_total: number
          xml_content: string | null
        }
        Insert: {
          chave_acesso?: string | null
          created_at?: string
          data_autorizacao?: string | null
          data_emissao?: string
          erro_message?: string | null
          focus_nfe_ref?: string | null
          id?: string
          numero: number
          order_id: string
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie?: number
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_produtos: number
          valor_total: number
          xml_content?: string | null
        }
        Update: {
          chave_acesso?: string | null
          created_at?: string
          data_autorizacao?: string | null
          data_emissao?: string
          erro_message?: string | null
          focus_nfe_ref?: string | null
          id?: string
          numero?: number
          order_id?: string
          pdf_url?: string | null
          protocolo_autorizacao?: string | null
          serie?: number
          status?: string
          updated_at?: string
          valor_cofins?: number | null
          valor_icms?: number | null
          valor_ipi?: number | null
          valor_pis?: number | null
          valor_produtos?: number
          valor_total?: number
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          cost_per_ml: number | null
          created_at: string | null
          expiry_date: string | null
          id: string
          lot_code: string
          perfume_id: string
          qty_ml: number
          supplier: string | null
          total_cost: number | null
          warehouse_id: string
        }
        Insert: {
          cost_per_ml?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_code: string
          perfume_id: string
          qty_ml?: number
          supplier?: string | null
          total_cost?: number | null
          warehouse_id: string
        }
        Update: {
          cost_per_ml?: number | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          lot_code?: string
          perfume_id?: string
          qty_ml?: number
          supplier?: string | null
          total_cost?: number | null
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
      legal_documents: {
        Row: {
          content: string
          created_at: string
          effective_date: string
          id: string
          is_active: boolean
          requires_acceptance: boolean
          title: string
          type: string
          updated_at: string
          version: string
        }
        Insert: {
          content: string
          created_at?: string
          effective_date: string
          id?: string
          is_active?: boolean
          requires_acceptance?: boolean
          title: string
          type: string
          updated_at?: string
          version: string
        }
        Update: {
          content?: string
          created_at?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          requires_acceptance?: boolean
          title?: string
          type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      local_delivery_settings: {
        Row: {
          company_cep: string
          company_city: string
          company_state: string
          created_at: string
          id: string
          local_delivery_enabled: boolean
          local_delivery_fee: number
          local_delivery_radius_km: number | null
          pickup_address: string
          pickup_available: boolean
          pickup_instructions: string | null
          updated_at: string
        }
        Insert: {
          company_cep?: string
          company_city?: string
          company_state?: string
          created_at?: string
          id?: string
          local_delivery_enabled?: boolean
          local_delivery_fee?: number
          local_delivery_radius_km?: number | null
          pickup_address?: string
          pickup_available?: boolean
          pickup_instructions?: string | null
          updated_at?: string
        }
        Update: {
          company_cep?: string
          company_city?: string
          company_state?: string
          created_at?: string
          id?: string
          local_delivery_enabled?: boolean
          local_delivery_fee?: number
          local_delivery_radius_km?: number | null
          pickup_address?: string
          pickup_available?: boolean
          pickup_instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempt_type: string
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          attempt_type: string
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          attempt_type?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: []
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
      material_configurations: {
        Row: {
          auto_detect_enabled: boolean
          bottle_materials: Json
          created_at: string
          default_label_id: string | null
          default_label_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          auto_detect_enabled?: boolean
          bottle_materials?: Json
          created_at?: string
          default_label_id?: string | null
          default_label_name?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          auto_detect_enabled?: boolean
          bottle_materials?: Json
          created_at?: string
          default_label_id?: string | null
          default_label_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      material_lots: {
        Row: {
          cost_per_unit: number
          created_at: string
          expiry_date: string | null
          id: string
          lot_code: string | null
          material_id: string
          notes: string | null
          purchase_date: string
          quantity: number
          supplier: string | null
          total_cost: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          material_id: string
          notes?: string | null
          purchase_date?: string
          quantity: number
          supplier?: string | null
          total_cost: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          expiry_date?: string | null
          id?: string
          lot_code?: string | null
          material_id?: string
          notes?: string | null
          purchase_date?: string
          quantity?: number
          supplier?: string | null
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_lots_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          cost_per_unit: number
          created_at: string
          current_stock: number
          description: string | null
          id: string
          is_active: boolean
          min_stock_alert: number
          name: string
          supplier: string | null
          type: string
          unit: string
          updated_at: string
        }
        Insert: {
          category: string
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_alert?: number
          name: string
          supplier?: string | null
          type: string
          unit: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_per_unit?: number
          created_at?: string
          current_stock?: number
          description?: string | null
          id?: string
          is_active?: boolean
          min_stock_alert?: number
          name?: string
          supplier?: string | null
          type?: string
          unit?: string
          updated_at?: string
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
          payment_intent_id: string | null
          payment_method: string
          payment_status: string
          shipping_cost: number
          shipping_deadline: number | null
          shipping_service: string | null
          status: string
          stripe_session_id: string | null
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
          payment_intent_id?: string | null
          payment_method: string
          payment_status?: string
          shipping_cost?: number
          shipping_deadline?: number | null
          shipping_service?: string | null
          status?: string
          stripe_session_id?: string | null
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
          payment_intent_id?: string | null
          payment_method?: string
          payment_status?: string
          shipping_cost?: number
          shipping_deadline?: number | null
          shipping_service?: string | null
          status?: string
          stripe_session_id?: string | null
          subtotal?: number
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packaging_rules: {
        Row: {
          container_material_id: string
          created_at: string
          id: string
          is_active: boolean
          item_size_ml: number | null
          max_items: number
          priority: number
        }
        Insert: {
          container_material_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_size_ml?: number | null
          max_items: number
          priority?: number
        }
        Update: {
          container_material_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          item_size_ml?: number | null
          max_items?: number
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "packaging_rules_container_material_id_fkey"
            columns: ["container_material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          amount: number | null
          charge_id: string | null
          created_at: string
          currency: string | null
          event_id: string
          id: string
          order_id: string | null
          payment_intent_id: string | null
          raw_event: Json
          status: string | null
          transaction_id: string | null
          type: string
        }
        Insert: {
          amount?: number | null
          charge_id?: string | null
          created_at?: string
          currency?: string | null
          event_id: string
          id?: string
          order_id?: string | null
          payment_intent_id?: string | null
          raw_event: Json
          status?: string | null
          transaction_id?: string | null
          type: string
        }
        Update: {
          amount?: number | null
          charge_id?: string | null
          created_at?: string
          currency?: string | null
          event_id?: string
          id?: string
          order_id?: string | null
          payment_intent_id?: string | null
          raw_event?: Json
          status?: string | null
          transaction_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      perfume_prices: {
        Row: {
          created_at: string
          id: string
          perfume_id: string
          price: number
          size_ml: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          perfume_id: string
          price?: number
          size_ml: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          perfume_id?: string
          price?: number
          size_ml?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfume_prices_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
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
            foreignKeyName: "perfume_similarities_perfume_b_id_fkey"
            columns: ["perfume_b_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes: {
        Row: {
          available_sizes: Json | null
          avg_cost_per_ml: number | null
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
          last_cost_calculation: string | null
          name: string
          price_10ml: number | null
          price_2ml: number | null
          price_5ml: number | null
          price_full: number
          product_type: string | null
          source_size_ml: number | null
          target_margin_percentage: number | null
          top_notes: string[] | null
        }
        Insert: {
          available_sizes?: Json | null
          avg_cost_per_ml?: number | null
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
          last_cost_calculation?: string | null
          name: string
          price_10ml?: number | null
          price_2ml?: number | null
          price_5ml?: number | null
          price_full: number
          product_type?: string | null
          source_size_ml?: number | null
          target_margin_percentage?: number | null
          top_notes?: string[] | null
        }
        Update: {
          available_sizes?: Json | null
          avg_cost_per_ml?: number | null
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
          last_cost_calculation?: string | null
          name?: string
          price_10ml?: number | null
          price_2ml?: number | null
          price_5ml?: number | null
          price_full?: number
          product_type?: string | null
          source_size_ml?: number | null
          target_margin_percentage?: number | null
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
      price_calculation_logs: {
        Row: {
          action_type: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          new_prices: Json | null
          old_prices: Json | null
          perfume_id: string | null
          trigger_source: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          new_prices?: Json | null
          old_prices?: Json | null
          perfume_id?: string | null
          trigger_source?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          new_prices?: Json | null
          old_prices?: Json | null
          perfume_id?: string | null
          trigger_source?: string | null
        }
        Relationships: []
      }
      privacy_consents: {
        Row: {
          browser_fingerprint: string | null
          consent_type: string
          consented: boolean
          cookie_categories: Json | null
          created_at: string
          data_retention_days: number | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          legal_basis: string | null
          user_id: string | null
        }
        Insert: {
          browser_fingerprint?: string | null
          consent_type: string
          consented?: boolean
          cookie_categories?: Json | null
          created_at?: string
          data_retention_days?: number | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          user_id?: string | null
        }
        Update: {
          browser_fingerprint?: string | null
          consent_type?: string
          consented?: boolean
          cookie_categories?: Json | null
          created_at?: string
          data_retention_days?: number | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          legal_basis?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      product_fiscal_data: {
        Row: {
          cest: string | null
          cfop: string
          cofins_aliquota: number | null
          cofins_situacao_tributaria: string
          created_at: string
          icms_aliquota: number | null
          icms_situacao_tributaria: string
          id: string
          ipi_aliquota: number | null
          ipi_situacao_tributaria: string
          ncm: string
          observacoes: string | null
          origem_mercadoria: string
          perfume_id: string
          pis_aliquota: number | null
          pis_situacao_tributaria: string
          updated_at: string
        }
        Insert: {
          cest?: string | null
          cfop?: string
          cofins_aliquota?: number | null
          cofins_situacao_tributaria?: string
          created_at?: string
          icms_aliquota?: number | null
          icms_situacao_tributaria?: string
          id?: string
          ipi_aliquota?: number | null
          ipi_situacao_tributaria?: string
          ncm?: string
          observacoes?: string | null
          origem_mercadoria?: string
          perfume_id: string
          pis_aliquota?: number | null
          pis_situacao_tributaria?: string
          updated_at?: string
        }
        Update: {
          cest?: string | null
          cfop?: string
          cofins_aliquota?: number | null
          cofins_situacao_tributaria?: string
          created_at?: string
          icms_aliquota?: number | null
          icms_situacao_tributaria?: string
          id?: string
          ipi_aliquota?: number | null
          ipi_situacao_tributaria?: string
          ncm?: string
          observacoes?: string | null
          origem_mercadoria?: string
          perfume_id?: string
          pis_aliquota?: number | null
          pis_situacao_tributaria?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_fiscal_data_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: true
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recipes: {
        Row: {
          created_at: string
          id: string
          material_id: string
          perfume_id: string
          quantity_needed: number
          size_ml: number
        }
        Insert: {
          created_at?: string
          id?: string
          material_id: string
          perfume_id: string
          quantity_needed: number
          size_ml: number
        }
        Update: {
          created_at?: string
          id?: string
          material_id?: string
          perfume_id?: string
          quantity_needed?: number
          size_ml?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_recipes_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recipes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
      rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown | null
          request_count: number
          user_id: string | null
          window_start: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown | null
          request_count?: number
          user_id?: string | null
          window_start?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          request_count?: number
          user_id?: string | null
          window_start?: string
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
        ]
      }
      sac_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          description: string
          first_response_at: string | null
          id: string
          order_number: string | null
          priority: string
          protocol_number: string
          resolution: string | null
          resolution_date: string | null
          satisfaction_comment: string | null
          satisfaction_rating: number | null
          sla_due_date: string | null
          status: string
          subcategory: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          description: string
          first_response_at?: string | null
          id?: string
          order_number?: string | null
          priority?: string
          protocol_number: string
          resolution?: string | null
          resolution_date?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_due_date?: string | null
          status?: string
          subcategory?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          description?: string
          first_response_at?: string | null
          id?: string
          order_number?: string | null
          priority?: string
          protocol_number?: string
          resolution?: string | null
          resolution_date?: string | null
          satisfaction_comment?: string | null
          satisfaction_rating?: number | null
          sla_due_date?: string | null
          status?: string
          subcategory?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      security_audit_log: {
        Row: {
          created_at: string
          event_description: string
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          risk_level: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          risk_level?: string
          user_agent?: string | null
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
        ]
      }
      stock_movements: {
        Row: {
          change_ml: number
          created_at: string | null
          id: string
          lot_id: string | null
          material_id: string | null
          movement_type: string
          notes: string | null
          order_id: string | null
          perfume_id: string
          related_order_id: string | null
        }
        Insert: {
          change_ml: number
          created_at?: string | null
          id?: string
          lot_id?: string | null
          material_id?: string | null
          movement_type: string
          notes?: string | null
          order_id?: string | null
          perfume_id: string
          related_order_id?: string | null
        }
        Update: {
          change_ml?: number
          created_at?: string | null
          id?: string
          lot_id?: string | null
          material_id?: string | null
          movement_type?: string
          notes?: string | null
          order_id?: string | null
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
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      support_macros: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
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
      terms_acceptance: {
        Row: {
          accepted_at: string
          id: string
          ip_address: unknown | null
          type: string
          user_agent: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: unknown | null
          type?: string
          user_agent?: string | null
          user_id?: string | null
          version: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: unknown | null
          type?: string
          user_agent?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      add_points_transaction: {
        Args: {
          points_delta: number
          related_order_id?: string
          transaction_description?: string
          transaction_source: string
          user_uuid: string
        }
        Returns: string
      }
      apply_coupon_to_order: {
        Args: { coupon_code: string; order_uuid: string }
        Returns: boolean
      }
      audit_query_performance: {
        Args: {
          additional_info?: Json
          execution_time_ms: number
          operation_name: string
          rows_processed?: number
        }
        Returns: undefined
      }
      auto_fix_perfume_prices: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_dynamic_product_costs: {
        Args: { perfume_uuid: string; sizes_array: number[] }
        Returns: {
          materials_cost_per_unit: number
          perfume_cost_per_unit: number
          size_ml: number
          suggested_price: number
          total_cost_per_unit: number
        }[]
      }
      calculate_notes_similarity: {
        Args: { perfume_a_id: string; perfume_b_id: string }
        Returns: number
      }
      calculate_packaging_costs: {
        Args: { cart_items: Json }
        Returns: {
          containers_needed: Json
          total_packaging_cost: number
        }[]
      }
      calculate_product_total_cost: {
        Args: { perfume_uuid: string; size_ml_param: number }
        Returns: {
          material_cost_per_unit: number
          perfume_cost_per_ml: number
          suggested_price: number
          total_cost_per_unit: number
        }[]
      }
      check_advanced_stock_alerts: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_level: string
          brand: string
          current_stock_ml: number
          days_until_stockout: number
          perfume_id: string
          perfume_name: string
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
          quantity_requested?: number
          size_ml_param: number
        }
        Returns: {
          available: boolean
          max_quantity: number
          stock_ml: number
        }[]
      }
      check_price_integrity: {
        Args: Record<PropertyKey, never>
        Returns: {
          brand: string
          current_prices: Json
          issue_type: string
          perfume_id: string
          perfume_name: string
          suggested_action: string
        }[]
      }
      check_rate_limit: {
        Args:
          | {
              email_param: string
              ip_param?: unknown
              max_attempts?: number
              window_minutes?: number
            }
          | {
              p_endpoint?: string
              p_ip_address?: unknown
              p_limit?: number
              p_user_id?: string
              p_window_minutes?: number
            }
        Returns: boolean
      }
      check_stock_availability: {
        Args: {
          perfume_uuid: string
          quantity_requested: number
          size_ml_param: number
        }
        Returns: {
          available: boolean
          available_ml: number
          available_units: number
          message: string
        }[]
      }
      check_user_rate_limit: {
        Args: { endpoint_name?: string; max_requests?: number }
        Returns: boolean
      }
      clean_duplicate_perfumes: {
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
      create_cart_recovery_attempt: {
        Args: {
          cart_session_uuid: string
          discount_code_param?: string
          discount_offered_param?: number
          message_param?: string
          recovery_type_param: string
          subject_param?: string
        }
        Returns: string
      }
      daily_price_integrity_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      detect_abandoned_carts: {
        Args: Record<PropertyKey, never>
        Returns: {
          cart_session_id: string
          hours_since_abandonment: number
          items_count: number
          priority_score: number
          recommended_action: string
          session_id: string
          total_value: number
          user_id: string
        }[]
      }
      detect_material_info: {
        Args: { material_name: string }
        Returns: Json
      }
      fix_perfume_margin: {
        Args: { new_margin_percentage?: number; perfume_uuid: string }
        Returns: boolean
      }
      force_correct_margin_pricing: {
        Args: { perfume_uuid: string; target_margin_multiplier?: number }
        Returns: Json
      }
      generate_affiliate_code: {
        Args: { user_name?: string }
        Returns: string
      }
      generate_fiscal_note_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_sac_protocol: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_promotion: {
        Args: { perfume_uuid: string }
        Returns: {
          description: string
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          promotional_price_10ml: number
          promotional_price_5ml: number
          promotional_price_full: number
          title: string
        }[]
      }
      get_active_promotion_optimized: {
        Args: { perfume_uuid: string }
        Returns: {
          description: string
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          promotional_price_10ml: number
          promotional_price_5ml: number
          promotional_price_full: number
          time_remaining: unknown
          title: string
        }[]
      }
      get_active_promotions: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          current_price_10ml: number
          current_price_5ml: number
          current_price_full: number
          description: string
          discount_type: string
          discount_value: number
          ends_at: string
          id: string
          is_active: boolean
          original_price_10ml: number
          original_price_5ml: number
          original_price_full: number
          perfume_brand: string
          perfume_id: string
          perfume_name: string
          promotional_price_10ml: number
          promotional_price_5ml: number
          promotional_price_full: number
          starts_at: string
          title: string
          updated_at: string
        }[]
      }
      get_available_stock: {
        Args: { perfume_uuid: string; size_ml_param: number }
        Returns: number
      }
      get_company_public_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          cidade: string
          email_contato: string
          estado: string
          nome_fantasia: string
        }[]
      }
      get_perfume_dynamic_prices: {
        Args: { perfume_uuid: string }
        Returns: {
          price: number
          size_ml: number
        }[]
      }
      get_perfume_public_details: {
        Args: { perfume_uuid: string }
        Returns: {
          available_sizes: Json
          base_notes: string[]
          brand: string
          category: string
          created_at: string
          description: string
          family: string
          gender: string
          heart_notes: string[]
          id: string
          image_url: string
          name: string
          price_10ml: number
          price_2ml: number
          price_5ml: number
          price_full: number
          product_type: string
          source_size_ml: number
          top_notes: string[]
        }[]
      }
      get_perfume_recommendations: {
        Args: { limit_count?: number; min_score?: number; perfume_uuid: string }
        Returns: {
          brand: string
          image_url: string
          name: string
          perfume_id: string
          price_5ml: number
          price_full: number
          recommendation_reason: string
          similarity_score: number
        }[]
      }
      get_perfumes_secure: {
        Args: { limit_val?: number; offset_val?: number }
        Returns: {
          base_notes: string[]
          brand: string
          category: string
          created_at: string
          description: string
          family: string
          gender: string
          heart_notes: string[]
          id: string
          image_url: string
          name: string
          price_10ml: number
          price_2ml: number
          price_5ml: number
          price_full: number
          top_notes: string[]
        }[]
      }
      get_perfumes_with_stock: {
        Args: Record<PropertyKey, never>
        Returns: {
          base_notes: string[]
          brand: string
          category: string
          created_at: string
          description: string
          family: string
          gender: string
          heart_notes: string[]
          id: string
          image_url: string
          last_stock_update: string
          name: string
          price_10ml: number
          price_5ml: number
          price_full: number
          stock_10ml: number
          stock_5ml: number
          stock_full: number
          stock_status: string
          top_notes: string[]
          total_stock_ml: number
        }[]
      }
      get_public_company_info: {
        Args: Record<PropertyKey, never>
        Returns: {
          cidade: string
          email_contato: string
          estado: string
          nome_fantasia: string
        }[]
      }
      get_sac_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_resolution_time: unknown
          open_tickets: number
          resolved_tickets: number
          total_tickets: number
        }[]
      }
      get_security_config: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_points_balance: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_user_recommendations: {
        Args: { limit_count?: number; user_uuid?: string }
        Returns: {
          brand: string
          image_url: string
          name: string
          perfume_id: string
          price_5ml: number
          price_full: number
          recommendation_reason: string
          recommendation_score: number
        }[]
      }
      hard_delete_user_data: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_search_count: {
        Args: { search_query: string }
        Returns: undefined
      }
      log_access_attempt: {
        Args: {
          action_type: string
          attempted_table: string
          success?: boolean
        }
        Returns: undefined
      }
      log_compliance_event: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_ip_address?: unknown
          p_legal_basis?: string
          p_resource_id?: string
          p_resource_type: string
          p_session_id?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_login_attempt: {
        Args: {
          attempt_type_param: string
          email_param: string
          ip_param?: unknown
          metadata_param?: Json
          user_agent_param?: string
        }
        Returns: string
      }
      log_perfume_interaction: {
        Args: {
          interaction_type_param: string
          metadata_param?: Json
          perfume_uuid: string
          position_param?: number
          source_page_param?: string
        }
        Returns: string
      }
      log_security_event: {
        Args:
          | {
              event_description_param: string
              event_type_param: string
              ip_address_param?: unknown
              metadata_param?: Json
              risk_level_param?: string
              user_agent_param?: string
              user_uuid: string
            }
          | {
              p_description: string
              p_event_type: string
              p_metadata?: Json
              p_risk_level?: string
              p_user_id: string
            }
        Returns: string
      }
      log_unauthorized_company_access: {
        Args: { p_action?: string; p_user_id?: string }
        Returns: undefined
      }
      log_user_access: {
        Args: {
          access_route: string
          client_ip?: unknown
          client_user_agent?: string
          user_uuid: string
        }
        Returns: string
      }
      mark_cart_as_abandoned: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      process_affiliate_referral: {
        Args: { affiliate_code: string; order_id: string; order_total: number }
        Returns: boolean
      }
      process_order_stock_movement: {
        Args: { order_uuid: string }
        Returns: Json
      }
      recalculate_all_material_costs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recalculate_all_perfume_prices: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      recalculate_all_prices: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_perfume_prices_after_material_change: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_perfume_prices_for_sizes: {
        Args: { perfume_uuid: string; sizes: number[] }
        Returns: boolean
      }
      sanitize_search_input: {
        Args: { input_text: string }
        Returns: string
      }
      secure_perfume_access: {
        Args: { perfume_id: string }
        Returns: boolean
      }
      set_perfume_price: {
        Args: {
          perfume_uuid: string
          price_param: number
          size_ml_param: number
        }
        Returns: string
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      track_query_performance: {
        Args: {
          execution_time_ms: number
          query_type: string
          rows_affected?: number
        }
        Returns: undefined
      }
      update_material_avg_cost: {
        Args: { material_uuid: string }
        Returns: undefined
      }
      update_perfume_avg_cost: {
        Args: { perfume_uuid: string }
        Returns: undefined
      }
      update_perfume_avg_cost_safe: {
        Args: { perfume_uuid: string }
        Returns: boolean
      }
      update_perfume_margin: {
        Args: { new_margin_percentage: number; perfume_uuid: string }
        Returns: Json
      }
      update_sales_statistics: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      upsert_reservation: {
        Args: {
          expires_minutes?: number
          perfume_uuid: string
          qty_param: number
          size_ml_param: number
          user_uuid?: string
        }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      user_has_purchased_perfume: {
        Args: { perfume_uuid: string; user_uuid: string }
        Returns: boolean
      }
      validate_and_sanitize_input: {
        Args: {
          allow_special_chars?: boolean
          input_text: string
          max_length?: number
        }
        Returns: string
      }
      validate_coupon: {
        Args: { coupon_code: string; order_total: number; user_uuid: string }
        Returns: Json
      }
      validate_coupon_advanced: {
        Args: {
          cart_items?: Json
          coupon_code: string
          order_total: number
          user_uuid: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "customer"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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

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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_addresses: {
        Row: {
          address: string
          address_type: string | null
          coin_symbol: string
          created_at: string
          derivation_index: number
          derivation_path: string | null
          estimated_network_fee: number | null
          expected_amount: number
          expires_at: string
          id: string
          network: string
          order_id: string
          recommended_total: number | null
          top_up_window_expires_at: string | null
        }
        Insert: {
          address: string
          address_type?: string | null
          coin_symbol: string
          created_at?: string
          derivation_index: number
          derivation_path?: string | null
          estimated_network_fee?: number | null
          expected_amount: number
          expires_at?: string
          id?: string
          network: string
          order_id: string
          recommended_total?: number | null
          top_up_window_expires_at?: string | null
        }
        Update: {
          address?: string
          address_type?: string | null
          coin_symbol?: string
          created_at?: string
          derivation_index?: number
          derivation_path?: string | null
          estimated_network_fee?: number | null
          expected_amount?: number
          expires_at?: string
          id?: string
          network?: string
          order_id?: string
          recommended_total?: number | null
          top_up_window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_crypto_addresses_order_id"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_audit_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          crypto_address_id: string | null
          event_data: Json
          event_type: string
          id: string
          order_id: string | null
          raw_payload: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          crypto_address_id?: string | null
          event_data?: Json
          event_type: string
          id?: string
          order_id?: string | null
          raw_payload?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          crypto_address_id?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          order_id?: string | null
          raw_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_audit_logs_crypto_address_id_fkey"
            columns: ["crypto_address_id"]
            isOneToOne: false
            referencedRelation: "crypto_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crypto_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_derivation_counters: {
        Row: {
          address_type: string
          coin_symbol: string
          created_at: string | null
          id: string
          next_index: number
          updated_at: string | null
        }
        Insert: {
          address_type?: string
          coin_symbol: string
          created_at?: string | null
          id?: string
          next_index?: number
          updated_at?: string | null
        }
        Update: {
          address_type?: string
          coin_symbol?: string
          created_at?: string | null
          id?: string
          next_index?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_price_snapshots: {
        Row: {
          coin_symbol: string
          created_at: string | null
          id: string
          order_id: string | null
          price_source: string
          usd_price: number
        }
        Insert: {
          coin_symbol: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          price_source?: string
          usd_price: number
        }
        Update: {
          coin_symbol?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          price_source?: string
          usd_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "crypto_price_snapshots_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_transactions: {
        Row: {
          amount: number
          block_height: number | null
          confirmations: number
          confirmed_at: string | null
          crypto_address_id: string
          detected_at: string
          id: string
          tx_hash: string
        }
        Insert: {
          amount: number
          block_height?: number | null
          confirmations?: number
          confirmed_at?: string | null
          crypto_address_id: string
          detected_at?: string
          id?: string
          tx_hash: string
        }
        Update: {
          amount?: number
          block_height?: number | null
          confirmations?: number
          confirmed_at?: string | null
          crypto_address_id?: string
          detected_at?: string
          id?: string
          tx_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_crypto_transactions_address"
            columns: ["crypto_address_id"]
            isOneToOne: false
            referencedRelation: "crypto_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
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
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          crypto_confirmations_required: number | null
          crypto_overpaid_amount: number | null
          crypto_payment_status: string | null
          crypto_total_received: number | null
          crypto_underpaid_amount: number | null
          id: string
          minecraft_username: string
          payment_method: string | null
          refund_address: string | null
          refund_status: string | null
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crypto_confirmations_required?: number | null
          crypto_overpaid_amount?: number | null
          crypto_payment_status?: string | null
          crypto_total_received?: number | null
          crypto_underpaid_amount?: number | null
          id?: string
          minecraft_username: string
          payment_method?: string | null
          refund_address?: string | null
          refund_status?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crypto_confirmations_required?: number | null
          crypto_overpaid_amount?: number | null
          crypto_payment_status?: string | null
          crypto_total_received?: number | null
          crypto_underpaid_amount?: number | null
          id?: string
          minecraft_username?: string
          payment_method?: string | null
          refund_address?: string | null
          refund_status?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          discord_avatar_url: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          minecraft_username: string | null
          total_spent: number | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discord_avatar_url?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          minecraft_username?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discord_avatar_url?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          minecraft_username?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stocks: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number | null
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stocks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      tebex_checkouts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          order_id: string
          status: string
          tebex_checkout_url: string
          tebex_ident: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id: string
          status?: string
          tebex_checkout_url: string
          tebex_ident: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          order_id?: string
          status?: string
          tebex_checkout_url?: string
          tebex_ident?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tebex_checkouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role_by_email: {
        Args: { _email: string }
        Returns: undefined
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      get_next_derivation_index: {
        Args: { p_address_type?: string; p_coin_symbol: string }
        Returns: number
      }
      get_static_file_url: { Args: { file_path: string }; Returns: string }
      handle_expired_crypto_payments: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_crypto_audit_event: {
        Args: {
          p_crypto_address_id?: string
          p_event_data?: Json
          p_event_type: string
          p_order_id?: string
          p_raw_payload?: Json
        }
        Returns: string
      }
      log_sensitive_access: {
        Args: {
          action_type: string
          details?: Json
          record_id?: string
          table_name: string
        }
        Returns: undefined
      }
      mask_discord_id: {
        Args: { discord_id: string; profile_user_id: string }
        Returns: string
      }
      mask_payment_intent_id: {
        Args: { payment_intent_id: string; user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

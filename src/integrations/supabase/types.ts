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
      activity_logs: {
        Row: {
          action: string
          actor: string
          created_at: string
          details: string | null
          id: string
        }
        Insert: {
          action: string
          actor: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          details?: string | null
          id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          billing_day: number
          connection_date: string | null
          created_at: string
          customer_code: string
          email: string | null
          id: string
          ip_address: string | null
          mac_address: string | null
          monthly_bill: number
          name: string
          onu_mac: string | null
          package_id: string | null
          password: string | null
          phone: string | null
          remarks: string | null
          status: string
          updated_at: string
          username: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          billing_day?: number
          connection_date?: string | null
          created_at?: string
          customer_code: string
          email?: string | null
          id?: string
          ip_address?: string | null
          mac_address?: string | null
          monthly_bill?: number
          name: string
          onu_mac?: string | null
          package_id?: string | null
          password?: string | null
          phone?: string | null
          remarks?: string | null
          status?: string
          updated_at?: string
          username?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          billing_day?: number
          connection_date?: string | null
          created_at?: string
          customer_code?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          mac_address?: string | null
          monthly_bill?: number
          name?: string
          onu_mac?: string | null
          package_id?: string | null
          password?: string | null
          phone?: string | null
          remarks?: string | null
          status?: string
          updated_at?: string
          username?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          billing_month: string
          created_at: string
          customer_id: string
          due_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          paid_amount: number
          remarks: string | null
          status: string
        }
        Insert: {
          amount: number
          billing_month: string
          created_at?: string
          customer_id: string
          due_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          paid_amount?: number
          remarks?: string | null
          status?: string
        }
        Update: {
          amount?: number
          billing_month?: string
          created_at?: string
          customer_id?: string
          due_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          paid_amount?: number
          remarks?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          monthly_price: number
          name: string
          speed_mbps: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_price: number
          name: string
          speed_mbps: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          monthly_price?: number
          name?: string
          speed_mbps?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          collector_name: string | null
          created_at: string
          customer_id: string
          id: string
          invoice_id: string | null
          payment_date: string
          payment_method: string
          remarks: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          collector_name?: string | null
          created_at?: string
          customer_id: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string
          remarks?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          collector_name?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          invoice_id?: string | null
          payment_date?: string
          payment_method?: string
          remarks?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          k: string
          updated_at: string
          v: Json
        }
        Insert: {
          k: string
          updated_at?: string
          v?: Json
        }
        Update: {
          k?: string
          updated_at?: string
          v?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          password: string
          phone: string | null
          role: string
          status: string
          username: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          password: string
          phone?: string | null
          role?: string
          status?: string
          username: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          password?: string
          phone?: string | null
          role?: string
          status?: string
          username?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

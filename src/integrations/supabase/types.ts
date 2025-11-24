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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      hostels: {
        Row: {
          created_at: string
          id: string
          name: string
          total_rooms: number
          type: string
          updated_at: string
          warden_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          total_rooms?: number
          type: string
          updated_at?: string
          warden_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          total_rooms?: number
          type?: string
          updated_at?: string
          warden_id?: string | null
        }
        Relationships: []
      }
      inventory_categories: {
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
      inventory_items: {
        Row: {
          assigned_by: string | null
          category_id: string
          condition: string
          created_at: string
          hostel_id: string | null
          id: string
          last_maintenance: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          quantity: number
          room_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          category_id: string
          condition?: string
          created_at?: string
          hostel_id?: string | null
          id?: string
          last_maintenance?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          category_id?: string
          condition?: string
          created_at?: string
          hostel_id?: string | null
          id?: string
          last_maintenance?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number
          room_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_occupants: {
        Row: {
          access_number: string
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          id: string
          registration_number: string
          room_id: string
          semester: number
          student_name: string
          updated_at: string | null
          year_of_study: number
        }
        Insert: {
          access_number: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          id?: string
          registration_number: string
          room_id: string
          semester: number
          student_name: string
          updated_at?: string | null
          year_of_study: number
        }
        Update: {
          access_number?: string
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          id?: string
          registration_number?: string
          room_id?: string
          semester?: number
          student_name?: string
          updated_at?: string | null
          year_of_study?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_occupants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          current_occupants: number
          hostel_id: string
          id: string
          room_number: string
          status: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          current_occupants?: number
          hostel_id: string
          id?: string
          room_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          current_occupants?: number
          hostel_id?: string
          id?: string
          room_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          assigned_hostel: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_login: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_hostel?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          last_login?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_hostel?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login?: string | null
          role?: string
          status?: string
          updated_at?: string
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
      warden_approvals: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          id: string
          item_details: Json | null
          request_date: string
          request_type: string
          status: string
          updated_at: string
          warden_id: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_details?: Json | null
          request_date?: string
          request_type: string
          status?: string
          updated_at?: string
          warden_id?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          item_details?: Json | null
          request_date?: string
          request_type?: string
          status?: string
          updated_at?: string
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warden_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warden_approvals_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_authorized: { Args: { user_email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "male_warden" | "female_warden"
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
      app_role: ["admin", "male_warden", "female_warden"],
    },
  },
} as const

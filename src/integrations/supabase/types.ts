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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          accent_color: string
          created_at: string
          id: string
          primary_color: string
          secondary_color: string
          turf_description: string | null
          turf_images: string[] | null
          turf_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          created_at?: string
          id?: string
          primary_color?: string
          secondary_color?: string
          turf_description?: string | null
          turf_images?: string[] | null
          turf_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          created_at?: string
          id?: string
          primary_color?: string
          secondary_color?: string
          turf_description?: string | null
          turf_images?: string[] | null
          turf_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocked_slots: {
        Row: {
          block_date: string
          created_at: string
          end_time: string
          id: string
          reason: string
          start_time: string
          turf_id: string
          user_id: string
        }
        Insert: {
          block_date: string
          created_at?: string
          end_time: string
          id?: string
          reason: string
          start_time: string
          turf_id: string
          user_id: string
        }
        Update: {
          block_date?: string
          created_at?: string
          end_time?: string
          id?: string
          reason?: string
          start_time?: string
          turf_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_tickets: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_used: boolean
          qr_data: string
          ticket_code: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_used?: boolean
          qr_data: string
          ticket_code: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_used?: boolean
          qr_data?: string
          ticket_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          customer_id: string
          discount_amount: number | null
          end_time: string
          id: string
          notes: string | null
          offer_id: string | null
          paid_amount: number | null
          payment_mode: string | null
          payment_status: string
          pending_amount: number | null
          promo_code_id: string | null
          sport_type: string
          start_time: string
          status: string
          total_amount: number
          turf_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id: string
          discount_amount?: number | null
          end_time: string
          id?: string
          notes?: string | null
          offer_id?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          payment_status?: string
          pending_amount?: number | null
          promo_code_id?: string | null
          sport_type: string
          start_time: string
          status?: string
          total_amount: number
          turf_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          customer_id?: string
          discount_amount?: number | null
          end_time?: string
          id?: string
          notes?: string | null
          offer_id?: string | null
          paid_amount?: number | null
          payment_mode?: string | null
          payment_status?: string
          pending_amount?: number | null
          promo_code_id?: string | null
          sport_type?: string
          start_time?: string
          status?: string
          total_amount?: number
          turf_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          last_visit: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          name: string
          phone: string
          tag: string | null
          total_bookings: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name: string
          phone: string
          tag?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          last_visit?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          name?: string
          phone?: string
          tag?: string | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          expense_date: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          points_required: number
          reward_type: string
          reward_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          points_required: number
          reward_type: string
          reward_value: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_views: {
        Row: {
          converted: boolean | null
          id: string
          offer_id: string
          session_id: string | null
          turf_id: string | null
          viewed_at: string
        }
        Insert: {
          converted?: boolean | null
          id?: string
          offer_id: string
          session_id?: string | null
          turf_id?: string | null
          viewed_at?: string
        }
        Update: {
          converted?: boolean | null
          id?: string
          offer_id?: string
          session_id?: string | null
          turf_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_views_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_views_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          applicable_days: string[] | null
          applicable_hours: string[] | null
          created_at: string
          current_decay_discount: number | null
          decay_stage: string | null
          description: string | null
          discount_type: string
          discount_value: number
          first_come_limit: number | null
          id: string
          is_active: boolean
          max_redemptions: number | null
          max_time_decay_discount: number | null
          min_players: number | null
          name: string
          offer_title: string | null
          offer_type: string | null
          revenue_from_offer: number | null
          revenue_strategy: string | null
          show_hours_before: number | null
          slot_demand_score: number | null
          time_decay_days: string[] | null
          time_decay_enabled: boolean | null
          time_decay_hours: string[] | null
          turf_id: string | null
          updated_at: string
          urgency_text: string | null
          usage_count: number | null
          user_id: string
          valid_from: string
          valid_until: string
          views_count: number | null
        }
        Insert: {
          applicable_days?: string[] | null
          applicable_hours?: string[] | null
          created_at?: string
          current_decay_discount?: number | null
          decay_stage?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          first_come_limit?: number | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          max_time_decay_discount?: number | null
          min_players?: number | null
          name: string
          offer_title?: string | null
          offer_type?: string | null
          revenue_from_offer?: number | null
          revenue_strategy?: string | null
          show_hours_before?: number | null
          slot_demand_score?: number | null
          time_decay_days?: string[] | null
          time_decay_enabled?: boolean | null
          time_decay_hours?: string[] | null
          turf_id?: string | null
          updated_at?: string
          urgency_text?: string | null
          usage_count?: number | null
          user_id: string
          valid_from: string
          valid_until: string
          views_count?: number | null
        }
        Update: {
          applicable_days?: string[] | null
          applicable_hours?: string[] | null
          created_at?: string
          current_decay_discount?: number | null
          decay_stage?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_come_limit?: number | null
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          max_time_decay_discount?: number | null
          min_players?: number | null
          name?: string
          offer_title?: string | null
          offer_type?: string | null
          revenue_from_offer?: number | null
          revenue_strategy?: string | null
          show_hours_before?: number | null
          slot_demand_score?: number | null
          time_decay_days?: string[] | null
          time_decay_enabled?: boolean | null
          time_decay_hours?: string[] | null
          turf_id?: string | null
          updated_at?: string
          urgency_text?: string | null
          usage_count?: number | null
          user_id?: string
          valid_from?: string
          valid_until?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount: number | null
          min_booking_amount: number | null
          turf_id: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_booking_amount?: number | null
          turf_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount?: number | null
          min_booking_amount?: number | null
          turf_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          created_at: string
          email: string | null
          favorite_sport: string | null
          id: string
          loyalty_points: number | null
          name: string
          phone: string
          total_bookings: number | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          favorite_sport?: string | null
          id?: string
          loyalty_points?: number | null
          name: string
          phone: string
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          favorite_sport?: string | null
          id?: string
          loyalty_points?: number | null
          name?: string
          phone?: string
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      slot_holds: {
        Row: {
          created_at: string
          end_time: string
          expires_at: string
          hold_date: string
          id: string
          session_id: string
          start_time: string
          turf_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          expires_at: string
          hold_date: string
          id?: string
          session_id: string
          start_time: string
          turf_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          expires_at?: string
          hold_date?: string
          id?: string
          session_id?: string
          start_time?: string
          turf_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_holds_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      turf_reviews: {
        Row: {
          booking_id: string | null
          created_at: string
          id: string
          rating: number
          review_text: string | null
          turf_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          turf_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          turf_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turf_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turf_reviews_turf_id_fkey"
            columns: ["turf_id"]
            isOneToOne: false
            referencedRelation: "turfs"
            referencedColumns: ["id"]
          },
        ]
      }
      turfs: {
        Row: {
          avg_rating: number | null
          base_price: number
          city: string | null
          created_at: string
          description: string | null
          google_maps_url: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_public: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          operating_hours_end: string
          operating_hours_start: string
          peak_hour_price: number | null
          phone_number: string | null
          price_1h: number | null
          price_2h: number | null
          price_3h: number | null
          review_count: number | null
          slot_duration: number
          sport_type: string
          state: string | null
          updated_at: string
          user_id: string
          weekday_price: number | null
          weekend_price: number | null
          whatsapp_number: string | null
        }
        Insert: {
          avg_rating?: number | null
          base_price: number
          city?: string | null
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_public?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          operating_hours_end?: string
          operating_hours_start?: string
          peak_hour_price?: number | null
          phone_number?: string | null
          price_1h?: number | null
          price_2h?: number | null
          price_3h?: number | null
          review_count?: number | null
          slot_duration?: number
          sport_type: string
          state?: string | null
          updated_at?: string
          user_id: string
          weekday_price?: number | null
          weekend_price?: number | null
          whatsapp_number?: string | null
        }
        Update: {
          avg_rating?: number | null
          base_price?: number
          city?: string | null
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_public?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          operating_hours_end?: string
          operating_hours_start?: string
          peak_hour_price?: number | null
          phone_number?: string | null
          price_1h?: number | null
          price_2h?: number | null
          price_3h?: number | null
          review_count?: number | null
          slot_duration?: number
          sport_type?: string
          state?: string | null
          updated_at?: string
          user_id?: string
          weekday_price?: number | null
          weekend_price?: number | null
          whatsapp_number?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "manager"
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
      app_role: ["admin", "user", "manager"],
    },
  },
} as const

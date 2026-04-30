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
      admin_audit_log: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          created_at: string | null
          id: string
          nda_signed_by_user1: boolean | null
          nda_signed_by_user2: boolean | null
          status: string | null
          user1_accepted_at: string | null
          user1_id: string | null
          user2_accepted_at: string | null
          user2_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nda_signed_by_user1?: boolean | null
          nda_signed_by_user2?: boolean | null
          status?: string | null
          user1_accepted_at?: string | null
          user1_id?: string | null
          user2_accepted_at?: string | null
          user2_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nda_signed_by_user1?: boolean | null
          nda_signed_by_user2?: boolean | null
          status?: string | null
          user1_accepted_at?: string | null
          user1_id?: string | null
          user2_accepted_at?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_swipe_counts: {
        Row: {
          count: number
          created_at: string
          id: string
          swipe_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          swipe_date?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          swipe_date?: string
          user_id?: string
        }
        Relationships: []
      }
      foundersync_history: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          leadership_style: string | null
          personality_type: string | null
          risk_tolerance: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          leadership_style?: string | null
          personality_type?: string | null
          risk_tolerance?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          leadership_style?: string | null
          personality_type?: string | null
          risk_tolerance?: string | null
          user_id?: string
        }
        Relationships: []
      }
      foundersync_results: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          leadership_style: string | null
          personality_type: string | null
          risk_tolerance: string | null
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          id?: string
          leadership_style?: string | null
          personality_type?: string | null
          risk_tolerance?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          leadership_style?: string | null
          personality_type?: string | null
          risk_tolerance?: string | null
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          ai_summary_user1: string | null
          ai_summary_user2: string | null
          created_at: string | null
          final_score: number | null
          hidden_reason: string | null
          id: string
          is_active: boolean | null
          is_visible: boolean | null
          match_score: number | null
          phase: string | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          ai_summary_user1?: string | null
          ai_summary_user2?: string | null
          created_at?: string | null
          final_score?: number | null
          hidden_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          match_score?: number | null
          phase?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          ai_summary_user1?: string | null
          ai_summary_user2?: string | null
          created_at?: string | null
          final_score?: number | null
          hidden_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_visible?: boolean | null
          match_score?: number | null
          phase?: string | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          profile_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          profile_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          connection_id: string | null
          content: string
          created_at: string | null
          delivery_status: string | null
          id: string
          is_read: boolean
          media_duration_seconds: number | null
          media_url: string | null
          message_type: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          connection_id?: string | null
          content: string
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean
          media_duration_seconds?: number | null
          media_url?: string | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          connection_id?: string | null
          content?: string
          created_at?: string | null
          delivery_status?: string | null
          id?: string
          is_read?: boolean
          media_duration_seconds?: number | null
          media_url?: string | null
          message_type?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nda_signatures: {
        Row: {
          accepted_at: string
          connection_id: string
          email: string
          full_name: string
          id: string
          ip_address: string | null
          profile_id: string
          signature_data: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          connection_id: string
          email: string
          full_name: string
          id?: string
          ip_address?: string | null
          profile_id: string
          signature_data?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          connection_id?: string
          email?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          profile_id?: string
          signature_data?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          related_user_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          related_user_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          related_user_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          event_date: string | null
          id: string
          link: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          photo_url: string
          upload_order: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_url: string
          upload_order?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          photo_url?: string
          upload_order?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          Ai_summary: string | null
          bio: string | null
          created_at: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_verified: boolean | null
          last_active: string | null
          location: string | null
          looking_for: string[] | null
          max_distance: number | null
          name: string
          preferred_age_max: number | null
          preferred_age_min: number | null
          preferred_gender: string | null
          profile_completed: boolean | null
          profile_pic_url: string | null
          role: string | null
          skills: string[] | null
          stage: string | null
          test_completed: boolean
          user_id: string | null
        }
        Insert: {
          age?: number | null
          Ai_summary?: string | null
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          location?: string | null
          looking_for?: string[] | null
          max_distance?: number | null
          name: string
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_gender?: string | null
          profile_completed?: boolean | null
          profile_pic_url?: string | null
          role?: string | null
          skills?: string[] | null
          stage?: string | null
          test_completed?: boolean
          user_id?: string | null
        }
        Update: {
          age?: number | null
          Ai_summary?: string | null
          bio?: string | null
          created_at?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          location?: string | null
          looking_for?: string[] | null
          max_distance?: number | null
          name?: string
          preferred_age_max?: number | null
          preferred_age_min?: number | null
          preferred_gender?: string | null
          profile_completed?: boolean | null
          profile_pic_url?: string | null
          role?: string | null
          skills?: string[] | null
          stage?: string | null
          test_completed?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      skill_categories: {
        Row: {
          color_code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color_code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color_code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      skill_category_mapping: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          skill_name: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          skill_name: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_category_mapping_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "spark_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_room_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          profile_id: string
          room_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          profile_id: string
          room_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          profile_id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spark_room_messages_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spark_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "spark_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      spark_rooms: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tier"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string | null
          target_user_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          target_user_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string | null
          target_user_id?: string | null
          user_id?: string | null
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
      admin_grant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_list_audit_log: {
        Args: { _limit?: number }
        Returns: {
          action: string
          actor_email: string
          actor_name: string
          actor_user_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_email: string
          target_name: string
          target_user_id: string
        }[]
      }
      admin_list_user_plans: {
        Args: { _search?: string }
        Returns: {
          current_period_end: string
          email: string
          name: string
          plan: Database["public"]["Enums"]["plan_tier"]
          status: string
          user_id: string
        }[]
      }
      admin_list_user_roles: {
        Args: { _search?: string }
        Returns: {
          email: string
          name: string
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      admin_revoke_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_user_plan: {
        Args: {
          _plan: Database["public"]["Enums"]["plan_tier"]
          _user_id: string
        }
        Returns: undefined
      }
      can_access_connection: {
        Args: { _connection_id: string }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_message: string
          p_related_id?: string
          p_related_user_id?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      extract_connection_id_from_storage_path: {
        Args: { _name: string }
        Returns: string
      }
      foundersync_compatibility: {
        Args: { user_a: string; user_b: string }
        Returns: number
      }
      get_incoming_likes_count: { Args: { _user_id: string }; Returns: number }
      get_matchmaking_candidates: {
        Args: { exclude_interacted?: boolean; limit_count?: number }
        Returns: {
          age: number
          bio: string
          id: string
          interests: string[]
          location: string
          looking_for: string[]
          match_score: number
          name: string
          profile_pic_url: string
          role: string
          skills: string[]
          stage: string
        }[]
      }
      get_my_profile_id: { Args: never; Returns: string }
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_daily_swipe: { Args: { _user_id: string }; Returns: number }
      my_incoming_likes_count: { Args: never; Returns: number }
      record_interaction: {
        Args: {
          p_from_profile_id: string
          p_interaction_type: string
          p_to_profile_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      plan_tier: "free" | "starter" | "pro"
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
      plan_tier: ["free", "starter", "pro"],
    },
  },
} as const

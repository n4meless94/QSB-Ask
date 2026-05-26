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
      event_members: {
        Row: {
          created_at: string
          event_id: string
          id: string
          invited_email: string | null
          role: Database["public"]["Enums"]["event_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          invited_email?: string | null
          role: Database["public"]["Enums"]["event_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          invited_email?: string | null
          role?: Database["public"]["Enums"]["event_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          duplicate_block_enabled: boolean
          ends_at: string | null
          id: string
          identity_mode: Database["public"]["Enums"]["identity_mode"]
          join_code: string
          moderation_enabled: boolean
          name: string
          question_character_limit: number
          question_rate_limit_seconds: number
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          time_zone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duplicate_block_enabled?: boolean
          ends_at?: string | null
          id?: string
          identity_mode?: Database["public"]["Enums"]["identity_mode"]
          join_code?: string
          moderation_enabled?: boolean
          name: string
          question_character_limit?: number
          question_rate_limit_seconds?: number
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          time_zone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duplicate_block_enabled?: boolean
          ends_at?: string | null
          id?: string
          identity_mode?: Database["public"]["Enums"]["identity_mode"]
          join_code?: string
          moderation_enabled?: boolean
          name?: string
          question_character_limit?: number
          question_rate_limit_seconds?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          time_zone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_hash: string | null
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          success: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          success?: boolean
        }
        Relationships: []
      }
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action"]
          actor_user_id: string
          created_at: string
          event_id: string
          from_status: Database["public"]["Enums"]["question_status"] | null
          id: string
          metadata: Json
          question_id: string
          to_status: Database["public"]["Enums"]["question_status"] | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action"]
          actor_user_id: string
          created_at?: string
          event_id: string
          from_status?: Database["public"]["Enums"]["question_status"] | null
          id?: string
          metadata?: Json
          question_id: string
          to_status?: Database["public"]["Enums"]["question_status"] | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action"]
          actor_user_id?: string
          created_at?: string
          event_id?: string
          from_status?: Database["public"]["Enums"]["question_status"] | null
          id?: string
          metadata?: Json
          question_id?: string
          to_status?: Database["public"]["Enums"]["question_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_sessions: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          event_id: string
          id: string
          session_token_hash: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_id: string
          id?: string
          session_token_hash: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          event_id?: string
          id?: string
          session_token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      question_versions: {
        Row: {
          created_at: string
          edited_by: string | null
          id: string
          question_id: string
          text: string
          version_number: number
        }
        Insert: {
          created_at?: string
          edited_by?: string | null
          id?: string
          question_id: string
          text: string
          version_number: number
        }
        Update: {
          created_at?: string
          edited_by?: string | null
          id?: string
          question_id?: string
          text?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_versions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_versions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_votes: {
        Row: {
          created_at: string
          id: string
          participant_session_id: string
          question_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_session_id: string
          question_id: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_session_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_votes_participant_session_id_fkey"
            columns: ["participant_session_id"]
            isOneToOne: false
            referencedRelation: "participant_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          current_text: string
          event_id: string
          id: string
          is_edited: boolean
          participant_session_id: string
          previous_status: Database["public"]["Enums"]["question_status"] | null
          status: Database["public"]["Enums"]["question_status"]
          submitted_at: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          current_text: string
          event_id: string
          id?: string
          is_edited?: boolean
          participant_session_id: string
          previous_status?:
            | Database["public"]["Enums"]["question_status"]
            | null
          status?: Database["public"]["Enums"]["question_status"]
          submitted_at?: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          current_text?: string
          event_id?: string
          id?: string
          is_edited?: boolean
          participant_session_id?: string
          previous_status?:
            | Database["public"]["Enums"]["question_status"]
            | null
          status?: Database["public"]["Enums"]["question_status"]
          submitted_at?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_participant_session_id_fkey"
            columns: ["participant_session_id"]
            isOneToOne: false
            referencedRelation: "participant_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          id: string
          rating_value: number | null
          selected_option_ids: string[] | null
          survey_question_id: string
          survey_response_id: string
          text_value: string | null
        }
        Insert: {
          id?: string
          rating_value?: number | null
          selected_option_ids?: string[] | null
          survey_question_id: string
          survey_response_id: string
          text_value?: string | null
        }
        Update: {
          id?: string
          rating_value?: number | null
          selected_option_ids?: string[] | null
          survey_question_id?: string
          survey_response_id?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_survey_question_id_fkey"
            columns: ["survey_question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_survey_response_id_fkey"
            columns: ["survey_response_id"]
            isOneToOne: false
            referencedRelation: "survey_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_options: {
        Row: {
          id: string
          label: string
          position: number
          survey_question_id: string
        }
        Insert: {
          id?: string
          label: string
          position: number
          survey_question_id: string
        }
        Update: {
          id?: string
          label?: string
          position?: number
          survey_question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_options_survey_question_id_fkey"
            columns: ["survey_question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          created_at: string
          id: string
          position: number
          prompt: string
          rating_scale: number | null
          survey_id: string
          type: Database["public"]["Enums"]["survey_question_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          position: number
          prompt: string
          rating_scale?: number | null
          survey_id: string
          type: Database["public"]["Enums"]["survey_question_type"]
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          prompt?: string
          rating_scale?: number | null
          survey_id?: string
          type?: Database["public"]["Enums"]["survey_question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          id: string
          participant_session_id: string
          submitted_at: string
          survey_id: string
        }
        Insert: {
          id?: string
          participant_session_id: string
          submitted_at?: string
          survey_id: string
        }
        Update: {
          id?: string
          participant_session_id?: string
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_participant_session_id_fkey"
            columns: ["participant_session_id"]
            isOneToOne: false
            referencedRelation: "participant_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string
          event_id: string
          id: string
          results_visible_to_participants: boolean
          status: Database["public"]["Enums"]["survey_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          event_id: string
          id?: string
          results_visible_to_participants?: boolean
          status?: Database["public"]["Enums"]["survey_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          event_id?: string
          id?: string
          results_visible_to_participants?: boolean
          status?: Database["public"]["Enums"]["survey_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_participant_session_id: { Args: never; Returns: string }
      edit_question_action: {
        Args: {
          actor_user_id: string
          expected_status: Database["public"]["Enums"]["question_status"]
          expected_updated_at: string
          next_text: string
          target_event_id: string
          target_question_id: string
        }
        Returns: Database["public"]["Tables"]["questions"]["Row"][]
      }
      generate_unique_join_code: { Args: never; Returns: string }
      has_event_role: {
        Args: {
          allowed_roles: Database["public"]["Enums"]["event_role"][]
          target_event_id: string
          target_user_id: string
        }
        Returns: boolean
      }
      is_active_event_member: {
        Args: { target_event_id: string; target_user_id: string }
        Returns: boolean
      }
      is_current_participant_for_event: {
        Args: { target_event_id: string }
        Returns: boolean
      }
      moderate_question_action: {
        Args: {
          action_metadata?: Json
          actor_user_id: string
          expected_status: Database["public"]["Enums"]["question_status"]
          expected_updated_at: string
          moderation_action: Database["public"]["Enums"]["moderation_action"]
          target_event_id: string
          target_question_id: string
          target_status: Database["public"]["Enums"]["question_status"] | null
        }
        Returns: Database["public"]["Tables"]["questions"]["Row"][]
      }
      upvote_question: {
        Args: {
          target_event_id: string
          target_participant_session_id: string
          target_question_id: string
        }
        Returns: {
          already_voted: boolean
          question: Database["public"]["Tables"]["questions"]["Row"]
        }[]
      }
    }
    Enums: {
      event_role: "organiser" | "moderator" | "speaker"
      event_status: "draft" | "active" | "ended" | "archived"
      identity_mode: "anonymous" | "name_required" | "name_email_required"
      member_status: "invited" | "active" | "removed"
      moderation_action:
        | "approve"
        | "dismiss"
        | "edit"
        | "archive"
        | "restore"
        | "mark_answered"
      question_status: "pending" | "live" | "answered" | "archived"
      survey_question_type:
        | "multiple_choice"
        | "multiple_select"
        | "rating"
        | "open_text"
      survey_status: "draft" | "published" | "closed"
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
      event_role: ["organiser", "moderator", "speaker"],
      event_status: ["draft", "active", "ended", "archived"],
      identity_mode: ["anonymous", "name_required", "name_email_required"],
      member_status: ["invited", "active", "removed"],
      moderation_action: [
        "approve",
        "dismiss",
        "edit",
        "archive",
        "restore",
        "mark_answered",
      ],
      question_status: ["pending", "live", "answered", "archived"],
      survey_question_type: [
        "multiple_choice",
        "multiple_select",
        "rating",
        "open_text",
      ],
      survey_status: ["draft", "published", "closed"],
    },
  },
} as const



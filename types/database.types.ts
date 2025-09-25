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
      canvas_collaborators: {
        Row: {
          budget: number | null
          canvas_id: string
          days: number | null
          id: number
          role: string
          user_id: string
          voted_location_ids: string[] | null
        }
        Insert: {
          budget?: number | null
          canvas_id: string
          days?: number | null
          id?: number
          role?: string
          user_id: string
          voted_location_ids?: string[] | null
        }
        Update: {
          budget?: number | null
          canvas_id?: string
          days?: number | null
          id?: number
          role?: string
          user_id?: string
          voted_location_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_collaborators_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_items: {
        Row: {
          canvas_id: string
          content: Json | null
          created_at: string
          created_by: string
          id: string
          position: number
          type: string
        }
        Insert: {
          canvas_id: string
          content?: Json | null
          created_at?: string
          created_by: string
          id?: string
          position?: number
          type: string
        }
        Update: {
          canvas_id?: string
          content?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          position?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_items_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      canvas_proposals: {
        Row: {
          canvas_id: string
          cities: string[]
          description: string | null
          id: string
          tag: string
        }
        Insert: {
          canvas_id: string
          cities: string[]
          description?: string | null
          id?: string
          tag: string
        }
        Update: {
          canvas_id?: string
          cities?: string[]
          description?: string | null
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "canvas_proposals_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      canvases: {
        Row: {
          created_at: string
          final_budget_per_day: number | null
          final_itinerary: Json | null
          final_location_ids: string[] | null
          final_proposal: Json | null
          final_total_days: number | null
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          final_budget_per_day?: number | null
          final_itinerary?: Json | null
          final_location_ids?: string[] | null
          final_proposal?: Json | null
          final_total_days?: number | null
          id?: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          final_budget_per_day?: number | null
          final_itinerary?: Json | null
          final_location_ids?: string[] | null
          final_proposal?: Json | null
          final_total_days?: number | null
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      decision_tree_questions: {
        Row: {
          canvas_id: string
          id: string
          level: number
          option_a_tags: string[]
          option_a_text: string
          option_b_tags: string[]
          option_b_text: string
          parent_option: string | null
          question_text: string
          status: string
        }
        Insert: {
          canvas_id: string
          id?: string
          level: number
          option_a_tags: string[]
          option_a_text: string
          option_b_tags: string[]
          option_b_text: string
          parent_option?: string | null
          question_text: string
          status?: string
        }
        Update: {
          canvas_id?: string
          id?: string
          level?: number
          option_a_tags?: string[]
          option_a_text?: string
          option_b_tags?: string[]
          option_b_text?: string
          parent_option?: string | null
          question_text?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_tree_questions_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
        ]
      }
      live_poll_answers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_poll_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "decision_tree_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          email: string
          id: string
        }
        Insert: {
          email: string
          id: string
        }
        Update: {
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
      can_access_canvas: {
        Args: { canvas_id_to_check: string }
        Returns: boolean
      }
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

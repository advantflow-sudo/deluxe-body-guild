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
      body_measurements: {
        Row: {
          arms_cm: number | null
          body_fat_pct: number | null
          chest_cm: number | null
          created_at: string
          hips_cm: number | null
          id: string
          measured_on: string
          thighs_cm: number | null
          user_id: string
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          arms_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on?: string
          thighs_cm?: number | null
          user_id: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          arms_cm?: number | null
          body_fat_pct?: number | null
          chest_cm?: number | null
          created_at?: string
          hips_cm?: number | null
          id?: string
          measured_on?: string
          thighs_cm?: number | null
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          completed_at: string | null
          id: string
          joined_at: string
          progress: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          id?: string
          joined_at?: string
          progress?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          ends_on: string | null
          goal_metric: string
          goal_target: number
          id: string
          is_premium: boolean
          points_reward: number
          starts_on: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          goal_metric: string
          goal_target: number
          id?: string
          is_premium?: boolean
          points_reward?: number
          starts_on?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_on?: string | null
          goal_metric?: string
          goal_target?: number
          id?: string
          is_premium?: boolean
          points_reward?: number
          starts_on?: string | null
          title?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
          user_id: string
          visibility: string
          workout_session_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id: string
          visibility?: string
          workout_session_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
          user_id?: string
          visibility?: string
          workout_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_devices: {
        Row: {
          access_token: string | null
          created_at: string
          display_name: string | null
          external_user_id: string | null
          id: string
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          external_user_id?: string | null
          id?: string
          last_synced_at?: string | null
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          display_name?: string | null
          external_user_id?: string | null
          id?: string
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          calories: number
          id: string
          stat_date: string
          steps: number
          streak: number
          user_id: string
          water_ml: number
        }
        Insert: {
          calories?: number
          id?: string
          stat_date?: string
          steps?: number
          streak?: number
          user_id: string
          water_ml?: number
        }
        Update: {
          calories?: number
          id?: string
          stat_date?: string
          steps?: number
          streak?: number
          user_id?: string
          water_ml?: number
        }
        Relationships: []
      }
      device_metrics: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          metric_type: string
          provider: string
          recorded_at: string
          unit: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          metric_type: string
          provider: string
          recorded_at?: string
          unit?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          metric_type?: string
          provider?: string
          recorded_at?: string
          unit?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "device_metrics_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "connected_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_states: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          provider: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          provider: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          provider?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          fitness_goal: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          fitness_goal?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          fitness_goal?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          note: string | null
          storage_path: string
          taken_on: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          storage_path: string
          taken_on?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          storage_path?: string
          taken_on?: string
          user_id?: string
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          claimed_at: string
          id: string
          reward_id: string
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          id?: string
          reward_id: string
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          id?: string
          reward_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_points: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      rewards_catalog: {
        Row: {
          active: boolean
          cost_points: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          title: string
          type: string
        }
        Insert: {
          active?: boolean
          cost_points: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title: string
          type: string
        }
        Update: {
          active?: boolean
          cost_points?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_followers: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      user_profiles_ext: {
        Row: {
          age: number | null
          created_at: string
          fitness_goal: string | null
          height_cm: number | null
          notifications_enabled: boolean
          onboarded_at: string | null
          preferred_type: string | null
          subscription_tier: string
          training_level: string | null
          units: string
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          fitness_goal?: string | null
          height_cm?: number | null
          notifications_enabled?: boolean
          onboarded_at?: string | null
          preferred_type?: string | null
          subscription_tier?: string
          training_level?: string | null
          units?: string
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          fitness_goal?: string | null
          height_cm?: number | null
          notifications_enabled?: boolean
          onboarded_at?: string | null
          preferred_type?: string | null
          subscription_tier?: string
          training_level?: string | null
          units?: string
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
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
      workout_sessions: {
        Row: {
          calories: number | null
          completed_at: string
          duration_min: number
          id: string
          notes: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          calories?: number | null
          completed_at?: string
          duration_min: number
          id?: string
          notes?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          calories?: number | null
          completed_at?: string
          duration_min?: number
          id?: string
          notes?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          calories: number | null
          category: string
          created_at: string
          description: string | null
          duration_min: number
          id: string
          image_url: string | null
          is_premium: boolean
          level: string
          title: string
          type: string
          video_url: string | null
        }
        Insert: {
          calories?: number | null
          category: string
          created_at?: string
          description?: string | null
          duration_min: number
          id?: string
          image_url?: string | null
          is_premium?: boolean
          level: string
          title: string
          type: string
          video_url?: string | null
        }
        Update: {
          calories?: number | null
          category?: string
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          image_url?: string | null
          is_premium?: boolean
          level?: string
          title?: string
          type?: string
          video_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: { _delta: number; _reason: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "coach" | "member"
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
      app_role: ["admin", "coach", "member"],
    },
  },
} as const

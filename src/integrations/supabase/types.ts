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
      daily_missions: {
        Row: {
          completed_at: string | null
          generated_at: string
          habit_ids: string[]
          id: string
          mindset_prompt: string | null
          mission_date: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string | null
          generated_at?: string
          habit_ids?: string[]
          id?: string
          mindset_prompt?: string | null
          mission_date?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string | null
          generated_at?: string
          habit_ids?: string[]
          id?: string
          mindset_prompt?: string | null
          mission_date?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: []
      }
      daily_scores: {
        Row: {
          habits_pts: number
          id: string
          mindset_pts: number
          score_date: string
          social_pts: number
          streak_day: number
          total: number
          updated_at: string
          user_id: string
          workout_pts: number
        }
        Insert: {
          habits_pts?: number
          id?: string
          mindset_pts?: number
          score_date?: string
          social_pts?: number
          streak_day?: number
          total?: number
          updated_at?: string
          user_id: string
          workout_pts?: number
        }
        Update: {
          habits_pts?: number
          id?: string
          mindset_pts?: number
          score_date?: string
          social_pts?: number
          streak_day?: number
          total?: number
          updated_at?: string
          user_id?: string
          workout_pts?: number
        }
        Relationships: []
      }
      daily_stats: {
        Row: {
          calories: number
          id: string
          sleep_hours: number
          stat_date: string
          steps: number
          streak: number
          user_id: string
          water_ml: number
        }
        Insert: {
          calories?: number
          id?: string
          sleep_hours?: number
          stat_date?: string
          steps?: number
          streak?: number
          user_id: string
          water_ml?: number
        }
        Update: {
          calories?: number
          id?: string
          sleep_hours?: number
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
      exercises: {
        Row: {
          compartment: string
          created_at: string
          cues: string | null
          equipment: string
          id: string
          is_premium: boolean
          muscle_group: string
          name: string
          slug: string
        }
        Insert: {
          compartment: string
          created_at?: string
          cues?: string | null
          equipment?: string
          id?: string
          is_premium?: boolean
          muscle_group: string
          name: string
          slug: string
        }
        Update: {
          compartment?: string
          created_at?: string
          cues?: string | null
          equipment?: string
          id?: string
          is_premium?: boolean
          muscle_group?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          active: boolean
          created_at: string
          habit_type: string
          icon: string | null
          id: string
          name: string
          sort_order: number
          target_value: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          habit_type?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
          target_value?: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          habit_type?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
          target_value?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          log_date: string
          logged_at: string
          meal_label: string | null
          protein_g: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          log_date?: string
          logged_at?: string
          meal_label?: string | null
          protein_g?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          log_date?: string
          logged_at?: string
          meal_label?: string | null
          protein_g?: number
          user_id?: string
        }
        Relationships: []
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
      partner_invites: {
        Row: {
          code: string
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          inviter_id: string
        }
        Insert: {
          code: string
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          inviter_id: string
        }
        Update: {
          code?: string
          consumed_at?: string | null
          consumed_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          inviter_id?: string
        }
        Relationships: []
      }
      partner_nudges: {
        Row: {
          created_at: string
          from_user: string
          id: string
          kind: string
          message: string | null
          partnership_id: string
          read_at: string | null
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          kind?: string
          message?: string | null
          partnership_id: string
          read_at?: string | null
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          kind?: string
          message?: string | null
          partnership_id?: string
          read_at?: string | null
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_nudges_partnership_id_fkey"
            columns: ["partnership_id"]
            isOneToOne: false
            referencedRelation: "partnerships"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          pairing_mode: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          pairing_mode?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          pairing_mode?: string
          status?: string
          user_a?: string
          user_b?: string
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
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
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
      streak_events: {
        Row: {
          created_at: string
          current_len: number
          event_date: string
          event_type: string
          id: string
          previous_len: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_len?: number
          event_date?: string
          event_type: string
          id?: string
          previous_len?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_len?: number
          event_date?: string
          event_type?: string
          id?: string
          previous_len?: number | null
          user_id?: string
        }
        Relationships: []
      }
      streaks: {
        Row: {
          current_len: number
          freezes_remaining: number
          freezes_reset_week: string
          last_active_date: string | null
          longest_len: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_len?: number
          freezes_remaining?: number
          freezes_reset_week?: string
          last_active_date?: string | null
          longest_len?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_len?: number
          freezes_remaining?: number
          freezes_reset_week?: string
          last_active_date?: string | null
          longest_len?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_challenge_members: {
        Row: {
          id: string
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenge_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_challenge_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_challenge_teams: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_challenge_teams_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "weekly_team_challenges"
            referencedColumns: ["id"]
          },
        ]
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
          country: string | null
          created_at: string
          fitness_goal: string | null
          height_cm: number | null
          notifications_enabled: boolean
          onboarded_at: string | null
          preferred_type: string | null
          reminder_evening_hour: number | null
          reminder_goals_enabled: boolean
          reminder_goals_hour: number | null
          reminder_morning_hour: number | null
          reminder_sleep_enabled: boolean
          reminder_water_enabled: boolean
          reminder_water_hour: number | null
          subscription_tier: string
          timezone: string
          training_level: string | null
          units: string
          updated_at: string
          user_id: string
          weekly_recap_enabled: boolean
          weight_kg: number | null
        }
        Insert: {
          age?: number | null
          country?: string | null
          created_at?: string
          fitness_goal?: string | null
          height_cm?: number | null
          notifications_enabled?: boolean
          onboarded_at?: string | null
          preferred_type?: string | null
          reminder_evening_hour?: number | null
          reminder_goals_enabled?: boolean
          reminder_goals_hour?: number | null
          reminder_morning_hour?: number | null
          reminder_sleep_enabled?: boolean
          reminder_water_enabled?: boolean
          reminder_water_hour?: number | null
          subscription_tier?: string
          timezone?: string
          training_level?: string | null
          units?: string
          updated_at?: string
          user_id: string
          weekly_recap_enabled?: boolean
          weight_kg?: number | null
        }
        Update: {
          age?: number | null
          country?: string | null
          created_at?: string
          fitness_goal?: string | null
          height_cm?: number | null
          notifications_enabled?: boolean
          onboarded_at?: string | null
          preferred_type?: string | null
          reminder_evening_hour?: number | null
          reminder_goals_enabled?: boolean
          reminder_goals_hour?: number | null
          reminder_morning_hour?: number | null
          reminder_sleep_enabled?: boolean
          reminder_water_enabled?: boolean
          reminder_water_hour?: number | null
          subscription_tier?: string
          timezone?: string
          training_level?: string | null
          units?: string
          updated_at?: string
          user_id?: string
          weekly_recap_enabled?: boolean
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
      weekly_team_challenges: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metric: string
          target_per_member: number
          team_size: number
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          target_per_member?: number
          team_size?: number
          title: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metric?: string
          target_per_member?: number
          team_size?: number
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      workout_block_exercises: {
        Row: {
          block_id: string
          exercise_id: string
          id: string
          sort_order: number
        }
        Insert: {
          block_id: string
          exercise_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          block_id?: string
          exercise_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_block_exercises_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "workout_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_block_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_blocks: {
        Row: {
          compartment: string
          created_at: string
          id: string
          label: string
          reps: string
          rest_sec: number
          sets: number
          sort_order: number
          workout_id: string
        }
        Insert: {
          compartment: string
          created_at?: string
          id?: string
          label: string
          reps?: string
          rest_sec?: number
          sets?: number
          sort_order?: number
          workout_id: string
        }
        Update: {
          compartment?: string
          created_at?: string
          id?: string
          label?: string
          reps?: string
          rest_sec?: number
          sets?: number
          sort_order?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_blocks_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_session_blocks: {
        Row: {
          block_id: string
          completed: boolean
          created_at: string
          exercise_id: string
          id: string
          session_id: string
          user_id: string
          workout_id: string
        }
        Insert: {
          block_id: string
          completed?: boolean
          created_at?: string
          exercise_id: string
          id?: string
          session_id: string
          user_id: string
          workout_id: string
        }
        Update: {
          block_id?: string
          completed?: boolean
          created_at?: string
          exercise_id?: string
          id?: string
          session_id?: string
          user_id?: string
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_session_blocks_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "workout_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_blocks_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_blocks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_session_blocks_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
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
      leaderboard_weekly: {
        Row: {
          active_days: number | null
          streak_peak: number | null
          user_id: string | null
          week_start: string | null
          week_total: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_partner_invite: {
        Args: { _code: string }
        Returns: {
          created_at: string
          ended_at: string | null
          id: string
          pairing_mode: string
          status: string
          user_a: string
          user_b: string
        }
        SetofOptions: {
          from: "*"
          to: "partnerships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auto_match_partner: {
        Args: never
        Returns: {
          created_at: string
          ended_at: string | null
          id: string
          pairing_mode: string
          status: string
          user_a: string
          user_b: string
        }
        SetofOptions: {
          from: "*"
          to: "partnerships"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_points: {
        Args: { _delta: number; _reason: string }
        Returns: number
      }
      complete_mission: {
        Args: never
        Returns: {
          completed_at: string | null
          generated_at: string
          habit_ids: string[]
          id: string
          mindset_prompt: string | null
          mission_date: string
          user_id: string
          workout_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_missions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      compute_daily_score: {
        Args: { _date?: string }
        Returns: {
          habits_pts: number
          id: string
          mindset_pts: number
          score_date: string
          social_pts: number
          streak_day: number
          total: number
          updated_at: string
          user_id: string
          workout_pts: number
        }
        SetofOptions: {
          from: "*"
          to: "daily_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_partner_invite: {
        Args: never
        Returns: {
          code: string
          consumed_at: string | null
          consumed_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          inviter_id: string
        }
        SetofOptions: {
          from: "*"
          to: "partner_invites"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cron_auto_match_unpaired: { Args: never; Returns: number }
      cron_generate_missions_for_active: { Args: never; Returns: number }
      cron_streak_at_risk_users: {
        Args: never
        Returns: {
          current_len: number
          user_id: string
        }[]
      }
      cron_users_for_reminder: {
        Args: { _kind: string }
        Returns: {
          user_id: string
        }[]
      }
      generate_daily_mission: {
        Args: never
        Returns: {
          completed_at: string | null
          generated_at: string
          habit_ids: string[]
          id: string
          mindset_prompt: string | null
          mission_date: string
          user_id: string
          workout_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "daily_missions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_premium_member: { Args: { _user_id: string }; Returns: boolean }
      touch_streak: {
        Args: never
        Returns: {
          current_len: number
          freezes_remaining: number
          freezes_reset_week: string
          last_active_date: string | null
          longest_len: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "streaks"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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

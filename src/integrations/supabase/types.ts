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
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      avatars: {
        Row: {
          age_range: string | null
          consistency_prompt: string | null
          created_at: string
          ethnicity: string | null
          framing_defaults: Json | null
          gender: string | null
          id: string
          identity_tokens: string[] | null
          image_url: string
          is_active: boolean
          name: string
          negative_drift_prompt: string | null
          prompt_base: string | null
          reference_images: Json | null
          style_tags: string[] | null
          tags: string[] | null
          updated_at: string | null
          wardrobe_defaults: Json | null
        }
        Insert: {
          age_range?: string | null
          consistency_prompt?: string | null
          created_at?: string
          ethnicity?: string | null
          framing_defaults?: Json | null
          gender?: string | null
          id?: string
          identity_tokens?: string[] | null
          image_url: string
          is_active?: boolean
          name: string
          negative_drift_prompt?: string | null
          prompt_base?: string | null
          reference_images?: Json | null
          style_tags?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          wardrobe_defaults?: Json | null
        }
        Update: {
          age_range?: string | null
          consistency_prompt?: string | null
          created_at?: string
          ethnicity?: string | null
          framing_defaults?: Json | null
          gender?: string | null
          id?: string
          identity_tokens?: string[] | null
          image_url?: string
          is_active?: boolean
          name?: string
          negative_drift_prompt?: string | null
          prompt_base?: string | null
          reference_images?: Json | null
          style_tags?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
          wardrobe_defaults?: Json | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean
          max_uses: number | null
          uses_count: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          uses_count?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      generation_cache: {
        Row: {
          created_at: string
          id: string
          image_url: string
          options_hash: string
          prompt_used: string | null
          seed_used: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          options_hash: string
          prompt_used?: string | null
          seed_used?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          options_hash?: string
          prompt_used?: string | null
          seed_used?: number | null
        }
        Relationships: []
      }
      generation_seeds: {
        Row: {
          created_at: string
          id: string
          options_hash: string
          seed: number
        }
        Insert: {
          created_at?: string
          id?: string
          options_hash: string
          seed: number
        }
        Update: {
          created_at?: string
          id?: string
          options_hash?: string
          seed?: number
        }
        Relationships: []
      }
      influencer_generations: {
        Row: {
          avatar_id: string | null
          created_at: string
          creative_id: string | null
          diagnostics: Json | null
          enhancements: Json | null
          fallback_notes: string | null
          format: string
          id: string
          latency_ms: number | null
          pose_id: string | null
          product_id: string | null
          product_variant_id: string | null
          prompt_final: string | null
          prompt_hash: string | null
          provider_model: string | null
          provider_params: Json | null
          resolved: Json | null
          result_image_url: string | null
          scene_id: string | null
          selection_payload: Json | null
          status: string
          style_preset: string | null
          user_id: string
        }
        Insert: {
          avatar_id?: string | null
          created_at?: string
          creative_id?: string | null
          diagnostics?: Json | null
          enhancements?: Json | null
          fallback_notes?: string | null
          format?: string
          id?: string
          latency_ms?: number | null
          pose_id?: string | null
          product_id?: string | null
          product_variant_id?: string | null
          prompt_final?: string | null
          prompt_hash?: string | null
          provider_model?: string | null
          provider_params?: Json | null
          resolved?: Json | null
          result_image_url?: string | null
          scene_id?: string | null
          selection_payload?: Json | null
          status?: string
          style_preset?: string | null
          user_id: string
        }
        Update: {
          avatar_id?: string | null
          created_at?: string
          creative_id?: string | null
          diagnostics?: Json | null
          enhancements?: Json | null
          fallback_notes?: string | null
          format?: string
          id?: string
          latency_ms?: number | null
          pose_id?: string | null
          product_id?: string | null
          product_variant_id?: string | null
          prompt_final?: string | null
          prompt_hash?: string | null
          provider_model?: string | null
          provider_params?: Json | null
          resolved?: Json | null
          result_image_url?: string | null
          scene_id?: string | null
          selection_payload?: Json | null
          status?: string
          style_preset?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_generations_avatar_id_fkey"
            columns: ["avatar_id"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_generations_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "user_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_generations_pose_id_fkey"
            columns: ["pose_id"]
            isOneToOne: false
            referencedRelation: "poses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_generations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "viral_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_generations_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_generations_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_jobs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          records_fetched: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type: Database["public"]["Enums"]["job_type"]
          records_fetched?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          records_fetched?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          triggered_by?: string | null
        }
        Relationships: []
      }
      mining_runs: {
        Row: {
          creators_fetched: number | null
          duration_ms: number | null
          error_message: string | null
          finished_at: string | null
          id: string
          products_fetched: number | null
          run_date: string
          status: string
          videos_fetched: number | null
        }
        Insert: {
          creators_fetched?: number | null
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          products_fetched?: number | null
          run_date?: string
          status?: string
          videos_fetched?: number | null
        }
        Update: {
          creators_fetched?: number | null
          duration_ms?: number | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          products_fetched?: number | null
          run_date?: string
          status?: string
          videos_fetched?: number | null
        }
        Relationships: []
      }
      poses: {
        Row: {
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          prompt_modifier: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          prompt_modifier: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          prompt_modifier?: string
        }
        Relationships: []
      }
      presets: {
        Row: {
          created_at: string
          icon_name: string | null
          id: string
          is_active: boolean
          label: string
          prompt_modifier: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["preset_type"]
          value: string
        }
        Insert: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label: string
          prompt_modifier?: string | null
          sort_order?: number | null
          type: Database["public"]["Enums"]["preset_type"]
          value: string
        }
        Update: {
          created_at?: string
          icon_name?: string | null
          id?: string
          is_active?: boolean
          label?: string
          prompt_modifier?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["preset_type"]
          value?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          product_id: string
          variant_image_url: string | null
          variant_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          product_id: string
          variant_image_url?: string | null
          variant_label?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          product_id?: string
          variant_image_url?: string | null
          variant_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "viral_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          subscription_expires_at: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          subscription_expires_at?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          composition_defaults: Json | null
          created_at: string
          environment_prompt: string | null
          id: string
          image_url: string | null
          is_active: boolean
          lighting_defaults: Json | null
          name: string
          negative_drift_prompt: string | null
          prompt_modifier: string
          scene_rules: Json | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          composition_defaults?: Json | null
          created_at?: string
          environment_prompt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lighting_defaults?: Json | null
          name: string
          negative_drift_prompt?: string | null
          prompt_modifier: string
          scene_rules?: Json | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          composition_defaults?: Json | null
          created_at?: string
          environment_prompt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lighting_defaults?: Json | null
          name?: string
          negative_drift_prompt?: string | null
          prompt_modifier?: string
          scene_rules?: Json | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cents: number
          cancelled_at: string | null
          created_at: string
          duration_months: number
          expires_at: string | null
          id: string
          ironpay_order_id: string | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          cancelled_at?: string | null
          created_at?: string
          duration_months: number
          expires_at?: string | null
          id?: string
          ironpay_order_id?: string | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          cancelled_at?: string | null
          created_at?: string
          duration_months?: number
          expires_at?: string | null
          id?: string
          ironpay_order_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_creatives: {
        Row: {
          additional_info: string | null
          avatar_used: string | null
          custom_pose_text: string | null
          custom_scenario_text: string | null
          enhancements: string[] | null
          environment: string | null
          format: string | null
          generated_at: string
          id: string
          image_url: string | null
          pose: string | null
          pose_id: string | null
          product_id: string | null
          prompt_used: string | null
          scenario_id: string | null
          style: string | null
          user_id: string
          veo_prompt: string | null
          veo_status: string | null
          veo_video_url: string | null
        }
        Insert: {
          additional_info?: string | null
          avatar_used?: string | null
          custom_pose_text?: string | null
          custom_scenario_text?: string | null
          enhancements?: string[] | null
          environment?: string | null
          format?: string | null
          generated_at?: string
          id?: string
          image_url?: string | null
          pose?: string | null
          pose_id?: string | null
          product_id?: string | null
          prompt_used?: string | null
          scenario_id?: string | null
          style?: string | null
          user_id: string
          veo_prompt?: string | null
          veo_status?: string | null
          veo_video_url?: string | null
        }
        Update: {
          additional_info?: string | null
          avatar_used?: string | null
          custom_pose_text?: string | null
          custom_scenario_text?: string | null
          enhancements?: string[] | null
          environment?: string | null
          format?: string | null
          generated_at?: string
          id?: string
          image_url?: string | null
          pose?: string | null
          pose_id?: string | null
          product_id?: string | null
          prompt_used?: string | null
          scenario_id?: string | null
          style?: string | null
          user_id?: string
          veo_prompt?: string | null
          veo_status?: string | null
          veo_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_creatives_pose_id_fkey"
            columns: ["pose_id"]
            isOneToOne: false
            referencedRelation: "poses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "viral_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creatives_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_creatives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veo_jobs: {
        Row: {
          created_at: string
          creative_id: string | null
          error_message: string | null
          id: string
          prompt: string
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          creative_id?: string | null
          error_message?: string | null
          id?: string
          prompt: string
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          creative_id?: string | null
          error_message?: string | null
          id?: string
          prompt?: string
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "veo_jobs_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "user_creatives"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_creators: {
        Row: {
          avatar_url: string | null
          avg_views: number | null
          created_at: string
          display_name: string | null
          engagement_rate: number | null
          first_seen_at: string | null
          followers: number | null
          id: string
          last_seen_at: string | null
          niche: string | null
          profile_url: string | null
          projected_revenue: number | null
          scraped_at: string | null
          total_revenue_estimated: number | null
          total_sales_estimated: number | null
          username: string
          viral_score: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_views?: number | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          first_seen_at?: string | null
          followers?: number | null
          id?: string
          last_seen_at?: string | null
          niche?: string | null
          profile_url?: string | null
          projected_revenue?: number | null
          scraped_at?: string | null
          total_revenue_estimated?: number | null
          total_sales_estimated?: number | null
          username: string
          viral_score?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_views?: number | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number | null
          first_seen_at?: string | null
          followers?: number | null
          id?: string
          last_seen_at?: string | null
          niche?: string | null
          profile_url?: string | null
          projected_revenue?: number | null
          scraped_at?: string | null
          total_revenue_estimated?: number | null
          total_sales_estimated?: number | null
          username?: string
          viral_score?: number | null
        }
        Relationships: []
      }
      viral_products: {
        Row: {
          affiliate_url: string | null
          category: string | null
          commission_rate: number | null
          country: string | null
          created_at: string
          creator_count: number | null
          engagement_rate: number | null
          first_seen_at: string | null
          growth_rate: number | null
          id: string
          image_url: string | null
          is_blacklisted: boolean | null
          last_seen_at: string | null
          price: number | null
          product_id_external: string | null
          product_url: string | null
          rank_position: number | null
          rating: number | null
          raw_data: Json | null
          revenue_30d: number | null
          revenue_7d: number | null
          revenue_today: number | null
          review_count: number | null
          sales: number | null
          scraped_at: string | null
          shop_logo_url: string | null
          shop_name: string | null
          source_url: string | null
          subcategory: string | null
          tags: string[] | null
          title: string
          trend_data: Json | null
          trend_direction: Database["public"]["Enums"]["trend_direction"] | null
          units_sold_30d: number | null
          units_sold_7d: number | null
          units_sold_today: number | null
          variations: Json | null
          video_count: number | null
          views: number | null
          viral_score: number | null
        }
        Insert: {
          affiliate_url?: string | null
          category?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          creator_count?: number | null
          engagement_rate?: number | null
          first_seen_at?: string | null
          growth_rate?: number | null
          id?: string
          image_url?: string | null
          is_blacklisted?: boolean | null
          last_seen_at?: string | null
          price?: number | null
          product_id_external?: string | null
          product_url?: string | null
          rank_position?: number | null
          rating?: number | null
          raw_data?: Json | null
          revenue_30d?: number | null
          revenue_7d?: number | null
          revenue_today?: number | null
          review_count?: number | null
          sales?: number | null
          scraped_at?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          source_url?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title: string
          trend_data?: Json | null
          trend_direction?:
            | Database["public"]["Enums"]["trend_direction"]
            | null
          units_sold_30d?: number | null
          units_sold_7d?: number | null
          units_sold_today?: number | null
          variations?: Json | null
          video_count?: number | null
          views?: number | null
          viral_score?: number | null
        }
        Update: {
          affiliate_url?: string | null
          category?: string | null
          commission_rate?: number | null
          country?: string | null
          created_at?: string
          creator_count?: number | null
          engagement_rate?: number | null
          first_seen_at?: string | null
          growth_rate?: number | null
          id?: string
          image_url?: string | null
          is_blacklisted?: boolean | null
          last_seen_at?: string | null
          price?: number | null
          product_id_external?: string | null
          product_url?: string | null
          rank_position?: number | null
          rating?: number | null
          raw_data?: Json | null
          revenue_30d?: number | null
          revenue_7d?: number | null
          revenue_today?: number | null
          review_count?: number | null
          sales?: number | null
          scraped_at?: string | null
          shop_logo_url?: string | null
          shop_name?: string | null
          source_url?: string | null
          subcategory?: string | null
          tags?: string[] | null
          title?: string
          trend_data?: Json | null
          trend_direction?:
            | Database["public"]["Enums"]["trend_direction"]
            | null
          units_sold_30d?: number | null
          units_sold_7d?: number | null
          units_sold_today?: number | null
          variations?: Json | null
          video_count?: number | null
          views?: number | null
          viral_score?: number | null
        }
        Relationships: []
      }
      viral_videos: {
        Row: {
          caption: string | null
          category: string | null
          comments: number | null
          created_at: string
          creator_id: string | null
          creator_username: string | null
          duration: number | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          likes: number | null
          product_image_url: string | null
          product_price: number | null
          product_revenue: number | null
          product_sales: number | null
          product_shop_url: string | null
          product_title: string | null
          region: string | null
          revenue_estimated: number | null
          sales_estimated: number | null
          scraped_at: string | null
          shares: number | null
          thumbnail_url: string | null
          tiktok_id: string | null
          transcription: string | null
          video_url: string | null
          views: number | null
          viral_score: number | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          comments?: number | null
          created_at?: string
          creator_id?: string | null
          creator_username?: string | null
          duration?: number | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          likes?: number | null
          product_image_url?: string | null
          product_price?: number | null
          product_revenue?: number | null
          product_sales?: number | null
          product_shop_url?: string | null
          product_title?: string | null
          region?: string | null
          revenue_estimated?: number | null
          sales_estimated?: number | null
          scraped_at?: string | null
          shares?: number | null
          thumbnail_url?: string | null
          tiktok_id?: string | null
          transcription?: string | null
          video_url?: string | null
          views?: number | null
          viral_score?: number | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          comments?: number | null
          created_at?: string
          creator_id?: string | null
          creator_username?: string | null
          duration?: number | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          likes?: number | null
          product_image_url?: string | null
          product_price?: number | null
          product_revenue?: number | null
          product_sales?: number | null
          product_shop_url?: string | null
          product_title?: string | null
          region?: string | null
          revenue_estimated?: number | null
          sales_estimated?: number | null
          scraped_at?: string | null
          shares?: number | null
          thumbnail_url?: string | null
          tiktok_id?: string | null
          transcription?: string | null
          video_url?: string | null
          views?: number | null
          viral_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "viral_videos_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "viral_creators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_uses: { Args: { _code: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      job_status: "pending" | "running" | "done" | "error"
      job_type: "products" | "videos" | "creators"
      preset_type: "pose" | "environment" | "style" | "enhancement" | "format"
      subscription_status: "active" | "trial" | "expired" | "cancelled"
      trend_direction: "up" | "down" | "stable"
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
      job_status: ["pending", "running", "done", "error"],
      job_type: ["products", "videos", "creators"],
      preset_type: ["pose", "environment", "style", "enhancement", "format"],
      subscription_status: ["active", "trial", "expired", "cancelled"],
      trend_direction: ["up", "down", "stable"],
    },
  },
} as const

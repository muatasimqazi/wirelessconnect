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
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default_billing: boolean
          is_default_shipping: boolean
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
          state: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default_billing?: boolean
          is_default_shipping?: boolean
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_email: string | null
          actor_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          notes: string | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          anonymous_id: string | null
          created_at: string
          currency: string
          expires_at: string
          id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          translations: Json
          type: Database["public"]["Enums"]["product_category_type"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          translations?: Json
          type: Database["public"]["Enums"]["product_category_type"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          translations?: Json
          type?: Database["public"]["Enums"]["product_category_type"]
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          minimum_order_amount: number | null
          starts_at: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          usage_limit: number | null
          used_count: number
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          minimum_order_amount?: number | null
          starts_at?: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          minimum_order_amount?: number | null
          starts_at?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_locale: string
          email: string
          full_name: string | null
          id: string
          order_number: string | null
          reason: string | null
          response_due_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_locale?: string
          email: string
          full_name?: string | null
          id?: string
          order_number?: string | null
          reason?: string | null
          response_due_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_locale?: string
          email?: string
          full_name?: string | null
          id?: string
          order_number?: string | null
          reason?: string | null
          response_due_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      device_intake_images: {
        Row: {
          alt_text: string | null
          alt_text_translations: Json
          created_at: string
          id: string
          image_type: string | null
          image_url: string
          intake_id: string
          internal_only: boolean
          is_primary: boolean
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          alt_text_translations?: Json
          created_at?: string
          id?: string
          image_type?: string | null
          image_url: string
          intake_id: string
          internal_only?: boolean
          is_primary?: boolean
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          alt_text_translations?: Json
          created_at?: string
          id?: string
          image_type?: string | null
          image_url?: string
          intake_id?: string
          internal_only?: boolean
          is_primary?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "device_intake_images_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "device_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      device_intakes: {
        Row: {
          acquisition_date: string
          acquisition_payment_method:
            | Database["public"]["Enums"]["acquisition_payment_method"]
            | null
          acquisition_source: string | null
          activation_lock_removed: boolean
          allow_pickup: boolean
          allow_shipping: boolean
          battery_cycle_count: number | null
          battery_health: number | null
          bluetooth_passed: boolean | null
          brand: string
          buttons_passed: boolean | null
          cameras_passed: boolean | null
          carrier: Database["public"]["Enums"]["carrier_type"] | null
          cellular_passed: boolean | null
          charging_port_passed: boolean | null
          color: string | null
          compare_at_price: number | null
          condition: Database["public"]["Enums"]["device_condition"] | null
          converted_to_product_at: string | null
          cosmetic_notes: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          data_wiped_verified: boolean
          defect_disclosure: string | null
          face_or_touch_id_passed: boolean | null
          factory_reset_verified: boolean
          featured_candidate: boolean
          functional_notes: string | null
          hold_period_days: number
          hold_period_waived: boolean
          hold_period_waived_reason: string | null
          hold_until_date: string | null
          id: string
          imei: string | null
          imei_verification_notes: string | null
          imei_verification_service: string | null
          imei_verification_status: Database["public"]["Enums"]["verification_status"]
          imei_verified_at: string | null
          imei_verified_by: string | null
          included_accessories: string | null
          is_blacklisted: boolean | null
          is_clean_imei: boolean | null
          is_financed: boolean | null
          microphone_passed: boolean | null
          model: string
          original_carrier: Database["public"]["Enums"]["carrier_type"] | null
          power_on_passed: boolean | null
          price: number | null
          product_id: string | null
          rejected_at: string | null
          rejection_reason: string | null
          seller_address: string | null
          seller_declaration_signed: boolean
          seller_declaration_signed_at: string | null
          seller_email: string | null
          seller_full_name: string | null
          seller_id_expiry: string | null
          seller_id_number_encrypted: string | null
          seller_id_state: string | null
          seller_id_type: Database["public"]["Enums"]["seller_id_type"] | null
          seller_phone: string | null
          serial_number: string | null
          sku: string | null
          speakers_passed: boolean | null
          status: Database["public"]["Enums"]["intake_status"]
          storage: string | null
          supplier_notes: string | null
          tested_at: string | null
          tested_by: string | null
          testing_notes: string | null
          testing_status: Database["public"]["Enums"]["testing_status"]
          touchscreen_passed: boolean | null
          updated_at: string
          updated_by: string | null
          warranty_days: number
          wifi_passed: boolean | null
          wireless_charging_passed: boolean | null
        }
        Insert: {
          acquisition_date?: string
          acquisition_payment_method?:
            | Database["public"]["Enums"]["acquisition_payment_method"]
            | null
          acquisition_source?: string | null
          activation_lock_removed?: boolean
          allow_pickup?: boolean
          allow_shipping?: boolean
          battery_cycle_count?: number | null
          battery_health?: number | null
          bluetooth_passed?: boolean | null
          brand: string
          buttons_passed?: boolean | null
          cameras_passed?: boolean | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          cellular_passed?: boolean | null
          charging_port_passed?: boolean | null
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          converted_to_product_at?: string | null
          cosmetic_notes?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          data_wiped_verified?: boolean
          defect_disclosure?: string | null
          face_or_touch_id_passed?: boolean | null
          factory_reset_verified?: boolean
          featured_candidate?: boolean
          functional_notes?: string | null
          hold_period_days?: number
          hold_period_waived?: boolean
          hold_period_waived_reason?: string | null
          hold_until_date?: string | null
          id?: string
          imei?: string | null
          imei_verification_notes?: string | null
          imei_verification_service?: string | null
          imei_verification_status?: Database["public"]["Enums"]["verification_status"]
          imei_verified_at?: string | null
          imei_verified_by?: string | null
          included_accessories?: string | null
          is_blacklisted?: boolean | null
          is_clean_imei?: boolean | null
          is_financed?: boolean | null
          microphone_passed?: boolean | null
          model: string
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          power_on_passed?: boolean | null
          price?: number | null
          product_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seller_address?: string | null
          seller_declaration_signed?: boolean
          seller_declaration_signed_at?: string | null
          seller_email?: string | null
          seller_full_name?: string | null
          seller_id_expiry?: string | null
          seller_id_number_encrypted?: string | null
          seller_id_state?: string | null
          seller_id_type?: Database["public"]["Enums"]["seller_id_type"] | null
          seller_phone?: string | null
          serial_number?: string | null
          sku?: string | null
          speakers_passed?: boolean | null
          status?: Database["public"]["Enums"]["intake_status"]
          storage?: string | null
          supplier_notes?: string | null
          tested_at?: string | null
          tested_by?: string | null
          testing_notes?: string | null
          testing_status?: Database["public"]["Enums"]["testing_status"]
          touchscreen_passed?: boolean | null
          updated_at?: string
          updated_by?: string | null
          warranty_days?: number
          wifi_passed?: boolean | null
          wireless_charging_passed?: boolean | null
        }
        Update: {
          acquisition_date?: string
          acquisition_payment_method?:
            | Database["public"]["Enums"]["acquisition_payment_method"]
            | null
          acquisition_source?: string | null
          activation_lock_removed?: boolean
          allow_pickup?: boolean
          allow_shipping?: boolean
          battery_cycle_count?: number | null
          battery_health?: number | null
          bluetooth_passed?: boolean | null
          brand?: string
          buttons_passed?: boolean | null
          cameras_passed?: boolean | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          cellular_passed?: boolean | null
          charging_port_passed?: boolean | null
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          converted_to_product_at?: string | null
          cosmetic_notes?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          data_wiped_verified?: boolean
          defect_disclosure?: string | null
          face_or_touch_id_passed?: boolean | null
          factory_reset_verified?: boolean
          featured_candidate?: boolean
          functional_notes?: string | null
          hold_period_days?: number
          hold_period_waived?: boolean
          hold_period_waived_reason?: string | null
          hold_until_date?: string | null
          id?: string
          imei?: string | null
          imei_verification_notes?: string | null
          imei_verification_service?: string | null
          imei_verification_status?: Database["public"]["Enums"]["verification_status"]
          imei_verified_at?: string | null
          imei_verified_by?: string | null
          included_accessories?: string | null
          is_blacklisted?: boolean | null
          is_clean_imei?: boolean | null
          is_financed?: boolean | null
          microphone_passed?: boolean | null
          model?: string
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          power_on_passed?: boolean | null
          price?: number | null
          product_id?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seller_address?: string | null
          seller_declaration_signed?: boolean
          seller_declaration_signed_at?: string | null
          seller_email?: string | null
          seller_full_name?: string | null
          seller_id_expiry?: string | null
          seller_id_number_encrypted?: string | null
          seller_id_state?: string | null
          seller_id_type?: Database["public"]["Enums"]["seller_id_type"] | null
          seller_phone?: string | null
          serial_number?: string | null
          sku?: string | null
          speakers_passed?: boolean | null
          status?: Database["public"]["Enums"]["intake_status"]
          storage?: string | null
          supplier_notes?: string | null
          tested_at?: string | null
          tested_by?: string | null
          testing_notes?: string | null
          testing_status?: Database["public"]["Enums"]["testing_status"]
          touchscreen_passed?: boolean | null
          updated_at?: string
          updated_by?: string | null
          warranty_days?: number
          wifi_passed?: boolean | null
          wireless_charging_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "device_intakes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_intakes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_cancellation_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_email: string
          customer_locale: string
          guest_access_token: string | null
          id: string
          order_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_email: string
          customer_locale?: string
          guest_access_token?: string | null
          id?: string
          order_id: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_email?: string
          customer_locale?: string
          guest_access_token?: string | null
          id?: string
          order_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_cancellation_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          battery_health: number | null
          created_at: string
          device_brand: string | null
          device_color: string | null
          device_condition:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model: string | null
          device_storage: string | null
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_image_url: string | null
          product_imei: string | null
          product_serial_number: string | null
          product_sku: string | null
          product_slug: string | null
          product_title: string
          quantity: number
          unit_price: number
          warranty_days: number
          warranty_expires_at: string | null
        }
        Insert: {
          battery_health?: number | null
          created_at?: string
          device_brand?: string | null
          device_color?: string | null
          device_condition?:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model?: string | null
          device_storage?: string | null
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_image_url?: string | null
          product_imei?: string | null
          product_serial_number?: string | null
          product_sku?: string | null
          product_slug?: string | null
          product_title: string
          quantity?: number
          unit_price: number
          warranty_days?: number
          warranty_expires_at?: string | null
        }
        Update: {
          battery_health?: number | null
          created_at?: string
          device_brand?: string | null
          device_color?: string | null
          device_condition?:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model?: string | null
          device_storage?: string | null
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_image_url?: string | null
          product_imei?: string | null
          product_serial_number?: string | null
          product_sku?: string | null
          product_slug?: string | null
          product_title?: string
          quantity?: number
          unit_price?: number
          warranty_days?: number
          warranty_expires_at?: string | null
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          billing_address_id: string | null
          cancellation_request_reason: string | null
          cancellation_request_status:
            | Database["public"]["Enums"]["request_status"]
            | null
          cancellation_requested_at: string | null
          cancellation_reviewed_at: string | null
          cancellation_reviewed_by: string | null
          cancelled_at: string | null
          coupon_code: string | null
          coupon_id: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_locale: string
          customer_name: string | null
          customer_phone: string | null
          discount_total: number
          fulfilled_at: string | null
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          guest_access_token: string
          id: string
          notes: string | null
          order_number: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          pickup_location_address: string | null
          pickup_location_name: string | null
          refunded_at: string | null
          shipped_at: string | null
          shipping_address_id: string | null
          shipping_carrier: string | null
          shipping_insurance_amount: number
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          stripe_tax_calculation_id: string | null
          subtotal: number
          tax_jurisdiction: string | null
          tax_total: number
          total: number
          tracking_number: string | null
          updated_at: string
          user_id: string | null
          warranty_started_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          billing_address_id?: string | null
          cancellation_request_reason?: string | null
          cancellation_request_status?:
            | Database["public"]["Enums"]["request_status"]
            | null
          cancellation_requested_at?: string | null
          cancellation_reviewed_at?: string | null
          cancellation_reviewed_by?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_locale?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_total?: number
          fulfilled_at?: string | null
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          guest_access_token?: string
          id?: string
          notes?: string | null
          order_number: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location_address?: string | null
          pickup_location_name?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_carrier?: string | null
          shipping_insurance_amount?: number
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_tax_calculation_id?: string | null
          subtotal?: number
          tax_jurisdiction?: string | null
          tax_total?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          warranty_started_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          billing_address_id?: string | null
          cancellation_request_reason?: string | null
          cancellation_request_status?:
            | Database["public"]["Enums"]["request_status"]
            | null
          cancellation_requested_at?: string | null
          cancellation_reviewed_at?: string | null
          cancellation_reviewed_by?: string | null
          cancelled_at?: string | null
          coupon_code?: string | null
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_locale?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount_total?: number
          fulfilled_at?: string | null
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          guest_access_token?: string
          id?: string
          notes?: string | null
          order_number?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pickup_location_address?: string | null
          pickup_location_name?: string | null
          refunded_at?: string | null
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_carrier?: string | null
          shipping_insurance_amount?: number
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_tax_calculation_id?: string | null
          subtotal?: number
          tax_jurisdiction?: string | null
          tax_total?: number
          total?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
          warranty_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          alt_text_translations: Json
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          alt_text_translations?: Json
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          alt_text_translations?: Json
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          acquisition_date: string | null
          acquisition_source: string | null
          activation_lock_removed: boolean
          allow_pickup: boolean
          allow_shipping: boolean
          barcode: string | null
          battery_cycle_count: number | null
          battery_health: number | null
          brand: string | null
          carrier: Database["public"]["Enums"]["carrier_type"] | null
          category_id: string | null
          category_type: Database["public"]["Enums"]["product_category_type"]
          color: string | null
          compare_at_price: number | null
          condition: Database["public"]["Enums"]["device_condition"] | null
          cost: number | null
          created_at: string
          description: string | null
          factory_reset_verified: boolean
          featured: boolean
          id: string
          imei: string | null
          imei_verification_status: Database["public"]["Enums"]["verification_status"]
          imei_verified_at: string | null
          imei_verified_by: string | null
          includes_cable: boolean
          includes_charger: boolean
          internal_device_notes: string | null
          is_clean_imei: boolean | null
          is_data_wiped: boolean
          is_tested: boolean
          is_unlocked: boolean | null
          model: string | null
          network_compatibility: string[] | null
          original_carrier: Database["public"]["Enums"]["carrier_type"] | null
          price: number
          quantity: number
          seo_description: string | null
          seo_title: string | null
          seo_translations: Json
          serial_number: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          storage: string | null
          subtitle: string | null
          supported_bands: string[] | null
          tested_at: string | null
          tested_by: string | null
          testing_notes: string | null
          testing_status: Database["public"]["Enums"]["testing_status"]
          title: string
          translations: Json
          updated_at: string
          warranty_days: number
        }
        Insert: {
          acquisition_date?: string | null
          acquisition_source?: string | null
          activation_lock_removed?: boolean
          allow_pickup?: boolean
          allow_shipping?: boolean
          barcode?: string | null
          battery_cycle_count?: number | null
          battery_health?: number | null
          brand?: string | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          category_id?: string | null
          category_type: Database["public"]["Enums"]["product_category_type"]
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          cost?: number | null
          created_at?: string
          description?: string | null
          factory_reset_verified?: boolean
          featured?: boolean
          id?: string
          imei?: string | null
          imei_verification_status?: Database["public"]["Enums"]["verification_status"]
          imei_verified_at?: string | null
          imei_verified_by?: string | null
          includes_cable?: boolean
          includes_charger?: boolean
          internal_device_notes?: string | null
          is_clean_imei?: boolean | null
          is_data_wiped?: boolean
          is_tested?: boolean
          is_unlocked?: boolean | null
          model?: string | null
          network_compatibility?: string[] | null
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          price: number
          quantity?: number
          seo_description?: string | null
          seo_title?: string | null
          seo_translations?: Json
          serial_number?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          storage?: string | null
          subtitle?: string | null
          supported_bands?: string[] | null
          tested_at?: string | null
          tested_by?: string | null
          testing_notes?: string | null
          testing_status?: Database["public"]["Enums"]["testing_status"]
          title: string
          translations?: Json
          updated_at?: string
          warranty_days?: number
        }
        Update: {
          acquisition_date?: string | null
          acquisition_source?: string | null
          activation_lock_removed?: boolean
          allow_pickup?: boolean
          allow_shipping?: boolean
          barcode?: string | null
          battery_cycle_count?: number | null
          battery_health?: number | null
          brand?: string | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          category_id?: string | null
          category_type?: Database["public"]["Enums"]["product_category_type"]
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          cost?: number | null
          created_at?: string
          description?: string | null
          factory_reset_verified?: boolean
          featured?: boolean
          id?: string
          imei?: string | null
          imei_verification_status?: Database["public"]["Enums"]["verification_status"]
          imei_verified_at?: string | null
          imei_verified_by?: string | null
          includes_cable?: boolean
          includes_charger?: boolean
          internal_device_notes?: string | null
          is_clean_imei?: boolean | null
          is_data_wiped?: boolean
          is_tested?: boolean
          is_unlocked?: boolean | null
          model?: string | null
          network_compatibility?: string[] | null
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          price?: number
          quantity?: number
          seo_description?: string | null
          seo_title?: string | null
          seo_translations?: Json
          serial_number?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          storage?: string | null
          subtitle?: string | null
          supported_bands?: string[] | null
          tested_at?: string | null
          tested_by?: string | null
          testing_notes?: string | null
          testing_status?: Database["public"]["Enums"]["testing_status"]
          title?: string
          translations?: Json
          updated_at?: string
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_locale: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_locale?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      warranties: {
        Row: {
          active: boolean
          claim_description: string | null
          claim_notes: string | null
          claim_resolved_at: string | null
          claim_status: Database["public"]["Enums"]["warranty_claim_status"]
          claim_submitted_at: string | null
          created_at: string
          customer_email: string
          customer_locale: string
          customer_name: string | null
          customer_phone: string | null
          device_brand: string | null
          device_imei: string | null
          device_model: string | null
          device_serial_number: string | null
          expires_at: string
          id: string
          order_id: string | null
          order_item_id: string | null
          product_id: string | null
          product_title: string
          starts_at: string
          updated_at: string
          user_id: string | null
          warranty_days: number
        }
        Insert: {
          active?: boolean
          claim_description?: string | null
          claim_notes?: string | null
          claim_resolved_at?: string | null
          claim_status?: Database["public"]["Enums"]["warranty_claim_status"]
          claim_submitted_at?: string | null
          created_at?: string
          customer_email: string
          customer_locale?: string
          customer_name?: string | null
          customer_phone?: string | null
          device_brand?: string | null
          device_imei?: string | null
          device_model?: string | null
          device_serial_number?: string | null
          expires_at: string
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_title: string
          starts_at?: string
          updated_at?: string
          user_id?: string | null
          warranty_days?: number
        }
        Update: {
          active?: boolean
          claim_description?: string | null
          claim_notes?: string | null
          claim_resolved_at?: string | null
          claim_status?: Database["public"]["Enums"]["warranty_claim_status"]
          claim_submitted_at?: string | null
          created_at?: string
          customer_email?: string
          customer_locale?: string
          customer_name?: string | null
          customer_phone?: string | null
          device_brand?: string | null
          device_imei?: string | null
          device_model?: string | null
          device_serial_number?: string | null
          expires_at?: string
          id?: string
          order_id?: string | null
          order_item_id?: string | null
          product_id?: string | null
          product_title?: string
          starts_at?: string
          updated_at?: string
          user_id?: string | null
          warranty_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "warranties_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "customer_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      warranty_claim_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          sort_order: number
          uploaded_by: string | null
          warranty_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          uploaded_by?: string | null
          warranty_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          uploaded_by?: string | null
          warranty_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranty_claim_images_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "warranties"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string
          stripe_event_id: string
        }
        Insert: {
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id: string
        }
        Update: {
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      customer_order_items: {
        Row: {
          battery_health: number | null
          created_at: string | null
          device_brand: string | null
          device_color: string | null
          device_condition:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model: string | null
          device_storage: string | null
          id: string | null
          line_total: number | null
          order_id: string | null
          product_id: string | null
          product_image_url: string | null
          product_sku: string | null
          product_slug: string | null
          product_title: string | null
          quantity: number | null
          unit_price: number | null
          warranty_days: number | null
          warranty_expires_at: string | null
        }
        Insert: {
          battery_health?: number | null
          created_at?: string | null
          device_brand?: string | null
          device_color?: string | null
          device_condition?:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model?: string | null
          device_storage?: string | null
          id?: string | null
          line_total?: number | null
          order_id?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_sku?: string | null
          product_slug?: string | null
          product_title?: string | null
          quantity?: number | null
          unit_price?: number | null
          warranty_days?: number | null
          warranty_expires_at?: string | null
        }
        Update: {
          battery_health?: number | null
          created_at?: string | null
          device_brand?: string | null
          device_color?: string | null
          device_condition?:
            | Database["public"]["Enums"]["device_condition"]
            | null
          device_model?: string | null
          device_storage?: string | null
          id?: string | null
          line_total?: number | null
          order_id?: string | null
          product_id?: string | null
          product_image_url?: string | null
          product_sku?: string | null
          product_slug?: string | null
          product_title?: string | null
          quantity?: number | null
          unit_price?: number | null
          warranty_days?: number | null
          warranty_expires_at?: string | null
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "public_products"
            referencedColumns: ["id"]
          },
        ]
      }
      public_products: {
        Row: {
          activation_lock_removed: boolean | null
          allow_pickup: boolean | null
          allow_shipping: boolean | null
          battery_cycle_count: number | null
          battery_health: number | null
          brand: string | null
          carrier: Database["public"]["Enums"]["carrier_type"] | null
          category_id: string | null
          category_type:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          color: string | null
          compare_at_price: number | null
          condition: Database["public"]["Enums"]["device_condition"] | null
          created_at: string | null
          description: string | null
          factory_reset_verified: boolean | null
          featured: boolean | null
          id: string | null
          imei_verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          includes_cable: boolean | null
          includes_charger: boolean | null
          is_clean_imei: boolean | null
          is_data_wiped: boolean | null
          is_tested: boolean | null
          is_unlocked: boolean | null
          model: string | null
          network_compatibility: string[] | null
          original_carrier: Database["public"]["Enums"]["carrier_type"] | null
          price: number | null
          quantity: number | null
          seo_description: string | null
          seo_title: string | null
          seo_translations: Json | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["product_status"] | null
          storage: string | null
          subtitle: string | null
          supported_bands: string[] | null
          testing_status: Database["public"]["Enums"]["testing_status"] | null
          title: string | null
          translations: Json | null
          updated_at: string | null
          warranty_days: number | null
        }
        Insert: {
          activation_lock_removed?: boolean | null
          allow_pickup?: boolean | null
          allow_shipping?: boolean | null
          battery_cycle_count?: number | null
          battery_health?: number | null
          brand?: string | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          category_id?: string | null
          category_type?:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          created_at?: string | null
          description?: string | null
          factory_reset_verified?: boolean | null
          featured?: boolean | null
          id?: string | null
          imei_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          includes_cable?: boolean | null
          includes_charger?: boolean | null
          is_clean_imei?: boolean | null
          is_data_wiped?: boolean | null
          is_tested?: boolean | null
          is_unlocked?: boolean | null
          model?: string | null
          network_compatibility?: string[] | null
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          price?: number | null
          quantity?: number | null
          seo_description?: string | null
          seo_title?: string | null
          seo_translations?: Json | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          storage?: string | null
          subtitle?: string | null
          supported_bands?: string[] | null
          testing_status?: Database["public"]["Enums"]["testing_status"] | null
          title?: string | null
          translations?: Json | null
          updated_at?: string | null
          warranty_days?: number | null
        }
        Update: {
          activation_lock_removed?: boolean | null
          allow_pickup?: boolean | null
          allow_shipping?: boolean | null
          battery_cycle_count?: number | null
          battery_health?: number | null
          brand?: string | null
          carrier?: Database["public"]["Enums"]["carrier_type"] | null
          category_id?: string | null
          category_type?:
            | Database["public"]["Enums"]["product_category_type"]
            | null
          color?: string | null
          compare_at_price?: number | null
          condition?: Database["public"]["Enums"]["device_condition"] | null
          created_at?: string | null
          description?: string | null
          factory_reset_verified?: boolean | null
          featured?: boolean | null
          id?: string | null
          imei_verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          includes_cable?: boolean | null
          includes_charger?: boolean | null
          is_clean_imei?: boolean | null
          is_data_wiped?: boolean | null
          is_tested?: boolean | null
          is_unlocked?: boolean | null
          model?: string | null
          network_compatibility?: string[] | null
          original_carrier?: Database["public"]["Enums"]["carrier_type"] | null
          price?: number | null
          quantity?: number | null
          seo_description?: string | null
          seo_title?: string | null
          seo_translations?: Json | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"] | null
          storage?: string | null
          subtitle?: string | null
          supported_bands?: string[] | null
          testing_status?: Database["public"]["Enums"]["testing_status"] | null
          title?: string | null
          translations?: Json | null
          updated_at?: string | null
          warranty_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      acquisition_payment_method:
        | "cash"
        | "check"
        | "zelle"
        | "venmo"
        | "store_credit"
        | "other"
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "status_change"
        | "role_change"
        | "login"
        | "export"
        | "request_submitted"
      carrier_type:
        | "unlocked"
        | "att"
        | "verizon"
        | "tmobile"
        | "sprint"
        | "other"
        | "unknown"
      coupon_type: "percentage" | "fixed_amount" | "free_shipping"
      device_condition: "like_new" | "excellent" | "good" | "fair"
      fulfillment_method: "pickup" | "shipping"
      intake_status:
        | "received"
        | "testing"
        | "needs_imei_check"
        | "needs_photos"
        | "hold_period"
        | "ready_to_list"
        | "converted_to_product"
        | "rejected"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "ready_for_pickup"
        | "shipped"
        | "delivered"
        | "picked_up"
        | "cancelled"
        | "refunded"
      payment_status:
        | "unpaid"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
      product_category_type:
        | "phone"
        | "tablet"
        | "laptop"
        | "accessory"
        | "other"
      product_status: "draft" | "active" | "archived" | "sold_out"
      repair_status:
        | "requested"
        | "confirmed"
        | "received"
        | "in_progress"
        | "waiting_on_parts"
        | "ready_for_pickup"
        | "completed"
        | "cancelled"
      request_status:
        | "submitted"
        | "under_review"
        | "approved"
        | "denied"
        | "completed"
        | "cancelled"
      seller_id_type:
        | "drivers_license"
        | "state_id"
        | "passport"
        | "military_id"
        | "other"
      testing_status:
        | "not_started"
        | "in_progress"
        | "passed"
        | "failed"
        | "needs_review"
      trade_in_status:
        | "submitted"
        | "under_review"
        | "offer_sent"
        | "accepted"
        | "rejected"
        | "expired"
        | "completed"
      user_role: "customer" | "staff" | "admin"
      verification_status: "not_checked" | "passed" | "failed" | "needs_review"
      warranty_claim_status:
        | "none"
        | "submitted"
        | "under_review"
        | "approved"
        | "denied"
        | "resolved"
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
      acquisition_payment_method: [
        "cash",
        "check",
        "zelle",
        "venmo",
        "store_credit",
        "other",
      ],
      audit_action: [
        "create",
        "update",
        "delete",
        "status_change",
        "role_change",
        "login",
        "export",
        "request_submitted",
      ],
      carrier_type: [
        "unlocked",
        "att",
        "verizon",
        "tmobile",
        "sprint",
        "other",
        "unknown",
      ],
      coupon_type: ["percentage", "fixed_amount", "free_shipping"],
      device_condition: ["like_new", "excellent", "good", "fair"],
      fulfillment_method: ["pickup", "shipping"],
      intake_status: [
        "received",
        "testing",
        "needs_imei_check",
        "needs_photos",
        "hold_period",
        "ready_to_list",
        "converted_to_product",
        "rejected",
      ],
      order_status: [
        "pending",
        "paid",
        "processing",
        "ready_for_pickup",
        "shipped",
        "delivered",
        "picked_up",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "unpaid",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      product_category_type: [
        "phone",
        "tablet",
        "laptop",
        "accessory",
        "other",
      ],
      product_status: ["draft", "active", "archived", "sold_out"],
      repair_status: [
        "requested",
        "confirmed",
        "received",
        "in_progress",
        "waiting_on_parts",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
      request_status: [
        "submitted",
        "under_review",
        "approved",
        "denied",
        "completed",
        "cancelled",
      ],
      seller_id_type: [
        "drivers_license",
        "state_id",
        "passport",
        "military_id",
        "other",
      ],
      testing_status: [
        "not_started",
        "in_progress",
        "passed",
        "failed",
        "needs_review",
      ],
      trade_in_status: [
        "submitted",
        "under_review",
        "offer_sent",
        "accepted",
        "rejected",
        "expired",
        "completed",
      ],
      user_role: ["customer", "staff", "admin"],
      verification_status: ["not_checked", "passed", "failed", "needs_review"],
      warranty_claim_status: [
        "none",
        "submitted",
        "under_review",
        "approved",
        "denied",
        "resolved",
      ],
    },
  },
} as const

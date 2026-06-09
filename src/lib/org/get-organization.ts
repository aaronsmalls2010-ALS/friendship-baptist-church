import { createAdminClient } from "@/lib/supabase/admin";
import { CHURCH_INFO } from "@/lib/constants";

export interface OrgSettings {
  church_name: string;
  tagline: string;
  pastor_name: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  phone: string;
  email: string;
  ein: string | null;
  office_hours: string;
  notify_new_members: boolean;
  notify_donations: boolean;
  notify_prayer: boolean;
  notify_sms_events: boolean;
  notify_weekly_digest: boolean;
}

const FALLBACK: OrgSettings = {
  church_name: CHURCH_INFO.name,
  tagline: CHURCH_INFO.tagline,
  pastor_name: CHURCH_INFO.pastor,
  address_street: CHURCH_INFO.address.street,
  address_city: CHURCH_INFO.address.city,
  address_state: CHURCH_INFO.address.state,
  address_zip: CHURCH_INFO.address.zip,
  phone: CHURCH_INFO.phone,
  email: CHURCH_INFO.email,
  ein: null,
  office_hours: "Monday - Friday: 9:00 AM - 3:00 PM",
  notify_new_members: true,
  notify_donations: true,
  notify_prayer: false,
  notify_sms_events: false,
  notify_weekly_digest: true,
};

export async function getOrganization(): Promise<OrgSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("organization_settings")
      .select("*")
      .eq("id", 1)
      .single();
    if (error || !data) return FALLBACK;
    return data as OrgSettings;
  } catch {
    return FALLBACK;
  }
}

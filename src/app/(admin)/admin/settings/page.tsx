"use client";

import { useState, useEffect } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion/fade-in";
import { Database, CreditCard, MessageSquare, Check, Upload, Video, Building, CheckCircle, XCircle } from "lucide-react";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { createClient } from "@/lib/supabase/client";
import { isSuperAdmin } from "@/lib/auth/roles";

type Toast = { message: string; type: "success" | "error" } | null;

export default function SettingsPage() {
  const { watchLiveEnabled, toggleWatchLive } = useSiteSettings();
  const [watchLiveLoading, setWatchLiveLoading] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [isSA, setIsSA] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // General / org fields
  const [churchName, setChurchName] = useState("");
  const [tagline, setTagline] = useState("");
  const [pastorName, setPastorName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [officeHours, setOfficeHours] = useState("");
  const [ein, setEin] = useState("");

  // Notifications
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyDonations, setNotifyDonations] = useState(true);
  const [notifyPrayer, setNotifyPrayer] = useState(false);
  const [notifySmsEvents, setNotifySmsEvents] = useState(false);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setIsSA(isSuperAdmin(user));

      const res = await fetch("/api/admin/settings/organization");
      if (res.ok) {
        const { settings: s } = await res.json();
        setChurchName(s.church_name ?? "");
        setTagline(s.tagline ?? "");
        setPastorName(s.pastor_name ?? "");
        setPhone(s.phone ?? "");
        setEmail(s.email ?? "");
        setStreet(s.address_street ?? "");
        setCity(s.address_city ?? "");
        setStateVal(s.address_state ?? "");
        setZip(s.address_zip ?? "");
        setOfficeHours(s.office_hours ?? "");
        setEin(s.ein ?? "");
        setNotifyNewMembers(s.notify_new_members ?? true);
        setNotifyDonations(s.notify_donations ?? true);
        setNotifyPrayer(s.notify_prayer ?? false);
        setNotifySmsEvents(s.notify_sms_events ?? false);
        setNotifyWeeklyDigest(s.notify_weekly_digest ?? true);
      }
      setOrgLoading(false);
    }
    load();
  }, []);

  async function saveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setSaving("general");
    const res = await fetch("/api/admin/settings/organization", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        church_name: churchName, tagline, pastor_name: pastorName,
        phone, email,
        address_street: street, address_city: city, address_state: stateVal, address_zip: zip,
        office_hours: officeHours, ein: ein || null,
      }),
    });
    setSaving(null);
    if (res.ok) showToast("Settings saved");
    else showToast("Failed to save settings", "error");
  }

  async function saveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setSaving("notifications");
    const res = await fetch("/api/admin/settings/organization", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notify_new_members: notifyNewMembers,
        notify_donations: notifyDonations,
        notify_prayer: notifyPrayer,
        notify_sms_events: notifySmsEvents,
        notify_weekly_digest: notifyWeeklyDigest,
      }),
    });
    setSaving(null);
    if (res.ok) showToast("Preferences saved");
    else showToast("Failed to save preferences", "error");
  }

  if (orgLoading) return <div className="flex justify-center py-24 text-warm-500">Loading…</div>;

  return (
    <div className="space-y-8">
      {toast && (
        <div role="alert"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      <AdminPageHeader title="Settings" description="Configure church website settings" />

      {/* Watch Live */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-warm-900 dark:text-warm-50">
            <Video className="h-5 w-5 text-purple-600" /> Watch Live Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
            <div>
              <p className="text-sm font-medium text-warm-900 dark:text-warm-50">Watch Live Button</p>
              <p className="text-xs text-warm-500">Show or hide the Watch Live button across the public website</p>
            </div>
            <Switch checked={watchLiveEnabled} disabled={watchLiveLoading}
              onCheckedChange={async (checked) => {
                setWatchLiveLoading(true);
                await toggleWatchLive(checked);
                setWatchLiveLoading(false);
              }} />
          </div>
        </CardContent>
      </Card>

      <FadeIn>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-warm-100 dark:bg-warm-800">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            {isSA && <TabsTrigger value="organization">Organization</TabsTrigger>}
          </TabsList>

          {/* General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">Church Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={saveGeneral}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="churchName">Church Name</Label>
                      <Input id="churchName" value={churchName} onChange={(e) => setChurchName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-warm-700 dark:text-warm-300">Address</h3>
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stateVal">State</Label>
                        <Input id="stateVal" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">Zip</Label>
                        <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="officeHours">Office Hours</Label>
                    <Input id="officeHours" value={officeHours} onChange={(e) => setOfficeHours(e.target.value)} />
                  </div>
                  <Button type="submit" disabled={saving === "general"} className="bg-purple-700 text-white hover:bg-purple-600">
                    {saving === "general" ? <span className="flex items-center gap-2"><Check className="h-4 w-4" /> Saving…</span> : "Save Settings"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-6" onSubmit={saveNotifications}>
                  <div className="space-y-4">
                    {[
                      { id: "notifyNewMembers", label: "Email for new members", desc: "Receive an email when someone joins", checked: notifyNewMembers, onChange: setNotifyNewMembers },
                      { id: "notifyDonations", label: "Email for donations", desc: "Get notified when a donation is received", checked: notifyDonations, onChange: setNotifyDonations },
                      { id: "notifyPrayer", label: "Email for prayer requests", desc: "Be alerted when new prayer requests are submitted", checked: notifyPrayer, onChange: setNotifyPrayer },
                      { id: "notifySmsEvents", label: "SMS for events", desc: "Send text reminders for upcoming events", checked: notifySmsEvents, onChange: setNotifySmsEvents },
                      { id: "notifyWeeklyDigest", label: "Weekly digest email", desc: "Receive a summary of church activity each week", checked: notifyWeeklyDigest, onChange: setNotifyWeeklyDigest },
                    ].map(({ id, label, desc, checked, onChange }) => (
                      <div key={id} className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                        <div>
                          <p className="text-sm font-medium text-warm-900 dark:text-warm-50">{label}</p>
                          <p className="text-xs text-warm-500">{desc}</p>
                        </div>
                        <Switch checked={checked} onCheckedChange={onChange} />
                      </div>
                    ))}
                  </div>
                  <Button type="submit" disabled={saving === "notifications"} className="bg-purple-700 text-white hover:bg-purple-600">
                    {saving === "notifications" ? "Saving…" : "Save Preferences"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">Third-Party Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { icon: Database, color: "green", label: "Supabase", desc: "Database & Authentication", status: "Connected", connected: true },
                    { icon: CreditCard, color: "yellow", label: "Stripe", desc: "Payment Processing", status: "Not Connected", connected: false },
                    { icon: MessageSquare, color: "yellow", label: "Twilio (SMS)", desc: "SMS & Messaging", status: "Not Connected", connected: false },
                  ].map(({ icon: Icon, color, label, desc, status, connected }) => (
                    <div key={label} className="flex flex-col gap-4 rounded-lg border border-warm-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-warm-800">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-${color}-50 p-2 dark:bg-${color}-900/20`}>
                          <Icon className={`h-5 w-5 text-${color}-600`} />
                        </div>
                        <div>
                          <p className="font-medium text-warm-900 dark:text-warm-50">{label}</p>
                          <p className="text-xs text-warm-500">{desc}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        connected ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}>{status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-700 ring-2 ring-purple-300" />
                      <span className="text-sm text-warm-600 dark:text-warm-400">Purple 700</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gold-400 ring-2 ring-gold-200" />
                      <span className="text-sm text-warm-600 dark:text-warm-400">Gold 400</span>
                    </div>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-warm-200 bg-warm-50 dark:border-warm-700 dark:bg-warm-800">
                      <Upload className="h-6 w-6 text-warm-400" />
                    </div>
                    <Button type="button" variant="outline" className="text-purple-700 border-purple-200 hover:bg-purple-50">
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization — super_admin only */}
          {isSA && (
            <TabsContent value="organization">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-warm-900 dark:text-warm-50">
                    <Building className="h-5 w-5 text-purple-600" /> Organization Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6" onSubmit={saveGeneral}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="orgChurchName">Church Name</Label>
                        <Input id="orgChurchName" value={churchName} onChange={(e) => setChurchName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgPastor">Pastor Name</Label>
                        <Input id="orgPastor" value={pastorName} onChange={(e) => setPastorName(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orgEin">EIN (Tax ID)</Label>
                      <Input id="orgEin" value={ein} onChange={(e) => setEin(e.target.value)}
                        placeholder="XX-XXXXXXX" maxLength={10} />
                      <p className="text-xs text-warm-500">Used on year-end contribution statements.</p>
                    </div>
                    <Button type="submit" disabled={saving === "general"} className="bg-purple-700 text-white hover:bg-purple-600">
                      {saving === "general" ? "Saving…" : "Save Organization Profile"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </FadeIn>
    </div>
  );
}

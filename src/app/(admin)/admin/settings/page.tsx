"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { CHURCH_INFO } from "@/lib/constants";
import { FadeIn } from "@/components/motion/fade-in";
import {
  Database,
  CreditCard,
  MessageSquare,
  Check,
  Upload,
  Video,
} from "lucide-react";
import { useSiteSettings } from "@/contexts/site-settings-context";

export default function SettingsPage() {
  const { watchLiveEnabled, toggleWatchLive } = useSiteSettings();
  const [watchLiveLoading, setWatchLiveLoading] = useState(false);

  // General tab state
  const [churchName, setChurchName] = useState<string>(CHURCH_INFO.name);
  const [tagline, setTagline] = useState<string>(CHURCH_INFO.tagline);
  const [phone, setPhone] = useState<string>(CHURCH_INFO.phone);
  const [email, setEmail] = useState<string>(CHURCH_INFO.email);
  const [street, setStreet] = useState<string>(CHURCH_INFO.address.street);
  const [city, setCity] = useState<string>(CHURCH_INFO.address.city);
  const [state, setState] = useState<string>(CHURCH_INFO.address.state);
  const [zip, setZip] = useState<string>(CHURCH_INFO.address.zip);
  const [officeHours, setOfficeHours] = useState(
    "Monday - Friday: 9:00 AM - 3:00 PM"
  );

  // Notifications tab state
  const [notifyNewMembers, setNotifyNewMembers] = useState(true);
  const [notifyDonations, setNotifyDonations] = useState(true);
  const [notifyPrayer, setNotifyPrayer] = useState(false);
  const [notifySmsEvents, setNotifySmsEvents] = useState(false);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  // Appearance tab state
  const [darkMode, setDarkMode] = useState(false);

  // Save feedback
  const [savedSection, setSavedSection] = useState<string | null>(null);

  function handleSave(section: string) {
    setSavedSection(section);
    setTimeout(() => setSavedSection(null), 2000);
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Settings"
        description="Configure church website settings"
      />

      {/* Watch Live Stream Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-warm-900 dark:text-warm-50">
            <Video className="h-5 w-5 text-purple-600" />
            Watch Live Stream
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
            <div>
              <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                Watch Live Button
              </p>
              <p className="text-xs text-warm-500">
                Show or hide the Watch Live button across the public website
              </p>
            </div>
            <Switch
              checked={watchLiveEnabled}
              disabled={watchLiveLoading}
              onCheckedChange={async (checked) => {
                setWatchLiveLoading(true);
                await toggleWatchLive(checked);
                setWatchLiveLoading(false);
              }}
            />
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
          </TabsList>

          {/* ── General Tab ───────────────────────────────────── */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                  Church Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave("general");
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="churchName">Church Name</Label>
                      <Input
                        id="churchName"
                        value={churchName}
                        onChange={(e) => setChurchName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-warm-700 dark:text-warm-300">
                      Address
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input
                        id="street"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="col-span-2 space-y-2 sm:col-span-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">Zip</Label>
                        <Input
                          id="zip"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="officeHours">Office Hours</Label>
                    <Input
                      id="officeHours"
                      value={officeHours}
                      onChange={(e) => setOfficeHours(e.target.value)}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="bg-purple-700 text-white hover:bg-purple-600"
                  >
                    {savedSection === "general" ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" /> Saved!
                      </span>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications Tab ─────────────────────────────── */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave("notifications");
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          Email notifications for new members
                        </p>
                        <p className="text-xs text-warm-500">
                          Receive an email when someone joins the church
                        </p>
                      </div>
                      <Switch
                        checked={notifyNewMembers}
                        onCheckedChange={setNotifyNewMembers}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          Email notifications for donations
                        </p>
                        <p className="text-xs text-warm-500">
                          Get notified when a donation is received
                        </p>
                      </div>
                      <Switch
                        checked={notifyDonations}
                        onCheckedChange={setNotifyDonations}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          Email notifications for prayer requests
                        </p>
                        <p className="text-xs text-warm-500">
                          Be alerted when new prayer requests are submitted
                        </p>
                      </div>
                      <Switch
                        checked={notifyPrayer}
                        onCheckedChange={setNotifyPrayer}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          SMS notifications for events
                        </p>
                        <p className="text-xs text-warm-500">
                          Send text reminders for upcoming events
                        </p>
                      </div>
                      <Switch
                        checked={notifySmsEvents}
                        onCheckedChange={setNotifySmsEvents}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-warm-100 p-4 dark:border-warm-800">
                      <div>
                        <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                          Weekly digest email
                        </p>
                        <p className="text-xs text-warm-500">
                          Receive a summary of church activity each week
                        </p>
                      </div>
                      <Switch
                        checked={notifyWeeklyDigest}
                        onCheckedChange={setNotifyWeeklyDigest}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-purple-700 text-white hover:bg-purple-600"
                  >
                    {savedSection === "notifications" ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" /> Saved!
                      </span>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Integrations Tab ──────────────────────────────── */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                  Third-Party Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Supabase */}
                  <div className="flex flex-col gap-4 rounded-lg border border-warm-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-warm-800">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                        <Database className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-warm-900 dark:text-warm-50">
                          Supabase
                        </p>
                        <p className="text-xs text-warm-500">
                          Database & Authentication
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Connected
                      </span>
                      <Input
                        value="postgresql://****:****@db.xxxx.supabase.co:5432/postgres"
                        disabled
                        className="max-w-xs text-xs"
                      />
                    </div>
                  </div>

                  {/* Stripe */}
                  <div className="flex flex-col gap-4 rounded-lg border border-warm-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-warm-800">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
                        <CreditCard className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-warm-900 dark:text-warm-50">
                          Stripe
                        </p>
                        <p className="text-xs text-warm-500">
                          Payment Processing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Not Connected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        Connect Stripe
                      </Button>
                    </div>
                  </div>

                  {/* Twilio */}
                  <div className="flex flex-col gap-4 rounded-lg border border-warm-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-warm-800">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-yellow-50 p-2 dark:bg-yellow-900/20">
                        <MessageSquare className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium text-warm-900 dark:text-warm-50">
                          Twilio (SMS)
                        </p>
                        <p className="text-xs text-warm-500">
                          SMS & Messaging
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Not Connected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Appearance Tab ─────────────────────────────────── */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-warm-900 dark:text-warm-50">
                  Appearance Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave("appearance");
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-700 ring-2 ring-purple-300" />
                        <span className="text-sm text-warm-600 dark:text-warm-400">
                          Purple 700
                        </span>
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gold-400 ring-2 ring-gold-200" />
                        <span className="text-sm text-warm-600 dark:text-warm-400">
                          Gold 400
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dark Mode */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-warm-900 dark:text-warm-50">
                        Dark Mode
                      </p>
                      <p className="text-xs text-warm-500">
                        Enable dark mode for the admin dashboard
                      </p>
                    </div>
                    <Switch
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                  </div>

                  <Separator />

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-warm-200 bg-warm-50 dark:border-warm-700 dark:bg-warm-800">
                        <Upload className="h-6 w-6 text-warm-400" />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="text-purple-700 border-purple-200 hover:bg-purple-50"
                      >
                        Upload Logo
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-purple-700 text-white hover:bg-purple-600"
                  >
                    {savedSection === "appearance" ? (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" /> Saved!
                      </span>
                    ) : (
                      "Save Appearance"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}

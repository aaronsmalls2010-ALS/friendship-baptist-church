"use client";

import { useState } from "react";
import { Pencil, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeIn } from "@/components/motion/fade-in";
import { formatDate } from "@/lib/utils";
import { MOCK_PROFILES } from "@/lib/mock-data";

const currentUser = MOCK_PROFILES[0];
const initials = `${currentUser.first_name[0]}${currentUser.last_name[0]}`;

export default function MyProfilePage() {
  // Personal Info
  const [firstName, setFirstName] = useState(currentUser.first_name);
  const [lastName, setLastName] = useState(currentUser.last_name);
  const [email] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [birthday, setBirthday] = useState(currentUser.birthday || "");

  // Contact
  const [address, setAddress] = useState(currentUser.address || "");
  const [city, setCity] = useState(currentUser.city || "Beaufort");
  const [state, setState] = useState(currentUser.state || "SC");
  const [zip, setZip] = useState(currentUser.zip || "29902");

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(
    currentUser.emergency_contact_name || ""
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    currentUser.emergency_contact_phone || ""
  );

  // Preferences
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [publicDirectory, setPublicDirectory] = useState(true);

  // Save feedback
  const [savedTab, setSavedTab] = useState<string | null>(null);

  function handleSave(tabName: string) {
    setSavedTab(tabName);
    setTimeout(() => setSavedTab(null), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <FadeIn direction="up">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white text-2xl font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-fluid-2xl text-warm-800">
                {firstName} {lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge className="bg-purple-100 text-purple-700 capitalize">
                  {currentUser.role}
                </Badge>
                <span className="text-sm text-warm-500">
                  Member since{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(currentUser.created_at))}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0">
              <Pencil className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
          </div>
        </Card>
      </FadeIn>

      {/* Tabbed Form */}
      <FadeIn direction="up" delay={0.1}>
        <Card className="p-6">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-warm-50 text-warm-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={() => handleSave("personal")}
                >
                  Save Changes
                </Button>
                {savedTab === "personal" && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="1234 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={() => handleSave("contact")}
                >
                  Save Changes
                </Button>
                {savedTab === "contact" && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </TabsContent>

            {/* Emergency Contact Tab */}
            <TabsContent value="emergency">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Contact Phone</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="(843) 555-0000"
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={() => handleSave("emergency")}
                >
                  Save Changes
                </Button>
                {savedTab === "emergency" && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-warm-800">
                      Email Notifications
                    </p>
                    <p className="text-sm text-warm-500">
                      Receive church updates and announcements via email
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifs}
                    onCheckedChange={setEmailNotifs}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-warm-800">
                      SMS Notifications
                    </p>
                    <p className="text-sm text-warm-500">
                      Receive text messages for urgent announcements
                    </p>
                  </div>
                  <Switch
                    checked={smsNotifs}
                    onCheckedChange={setSmsNotifs}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-warm-800">
                      Public Directory Listing
                    </p>
                    <p className="text-sm text-warm-500">
                      Allow other members to see your name and contact info
                    </p>
                  </div>
                  <Switch
                    checked={publicDirectory}
                    onCheckedChange={setPublicDirectory}
                  />
                </div>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  className="bg-purple-700 hover:bg-purple-800"
                  onClick={() => handleSave("preferences")}
                >
                  Save Changes
                </Button>
                {savedTab === "preferences" && (
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <Check className="h-4 w-4" /> Saved!
                  </span>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </FadeIn>
    </div>
  );
}

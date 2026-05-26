"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Loader2,
  Check,
  AlertCircle,
  Pencil,
  Users,
  Church,
  Heart,
  DollarSign,
  Settings,
  Crown,
  Plus,
  Trash2,
  UserPlus,
  RefreshCw,
  User,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FadeIn } from "@/components/motion/fade-in";
import { ProfilePictureUpload } from "@/components/portal/profile-picture-upload";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import { MOCK_DONATIONS } from "@/lib/mock-data";
import type {
  Profile,
  Family,
  FamilyMember,
  FamilyRelationship,
  Ministry,
  MinistryMemberStatus,
  MinistryRole,
  Donation,
} from "@/types";

// ── Extended types for API responses ────────────────────────────────

interface FamilyMemberWithProfile extends FamilyMember {
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    photo_url?: string;
  };
}

interface MinistryWithStatus extends Ministry {
  user_status: MinistryMemberStatus | null;
  user_role: MinistryRole | null;
}

// ── Constants ───────────────────────────────────────────────────────

const ROLE_BADGE_COLORS: Record<string, string> = {
  member: "bg-blue-100 text-blue-800",
  deacon: "bg-purple-100 text-purple-800",
  minister: "bg-amber-100 text-amber-800",
  admin: "bg-red-100 text-red-800",
  super_admin: "bg-red-200 text-red-900",
};

const RELATIONSHIP_LABELS: Record<FamilyRelationship, string> = {
  head: "Head of Household",
  spouse: "Spouse",
  child: "Child",
  parent: "Parent",
  sibling: "Sibling",
  grandchild: "Grandchild",
  grandparent: "Grandparent",
  other: "Other",
};

const RELATIONSHIP_OPTIONS: FamilyRelationship[] = [
  "spouse",
  "child",
  "parent",
  "sibling",
  "grandchild",
  "grandparent",
  "other",
];

const DONATION_TYPE_LABELS: Record<string, string> = {
  tithe: "Tithe",
  offering: "Offering",
  building_fund: "Building Fund",
  mission: "Missions",
  other: "Other",
};

// ── Form snapshot type for dirty detection ─────────────────────────

interface FormSnapshot {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  aboutBio: string;
  baptismDate: string;
  anniversary: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyPhone: string;
  emailNotifs: boolean;
  smsNotifs: boolean;
  publicDirectory: boolean;
}

function createSnapshot(values: FormSnapshot): FormSnapshot {
  return { ...values };
}

function isSnapshotEqual(a: FormSnapshot, b: FormSnapshot): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.phone === b.phone &&
    a.dateOfBirth === b.dateOfBirth &&
    a.gender === b.gender &&
    a.aboutBio === b.aboutBio &&
    a.baptismDate === b.baptismDate &&
    a.anniversary === b.anniversary &&
    a.address === b.address &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.emergencyName === b.emergencyName &&
    a.emergencyPhone === b.emergencyPhone &&
    a.emailNotifs === b.emailNotifs &&
    a.smsNotifs === b.smsNotifs &&
    a.publicDirectory === b.publicDirectory
  );
}

// ── Helper: initials ────────────────────────────────────────────────

function getInitials(first?: string, last?: string): string {
  return `${(first || "?")[0]}${(last || "?")[0]}`.toUpperCase();
}

// ── Helper: format currency ─────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ── Helper: short date ──────────────────────────────────────────────

function shortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ── Toast Component ─────────────────────────────────────────────────

interface Toast {
  type: "success" | "error";
  message: string;
}

function ToastBanner({ toast }: { toast: Toast }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        toast.type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}

// ── Main Page Component ─────────────────────────────────────────────

export default function MyProfilePage() {
  // ── Data state ──────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [ministries, setMinistries] = useState<MinistryWithStatus[]>([]);

  // ── Loading / error ─────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Toast ───────────────────────────────────────────────────────
  const [toast, setToast] = useState<Toast | null>(null);

  // ── UI state ────────────────────────────────────────────────────
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);

  // ── Personal Info form ──────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [aboutBio, setAboutBio] = useState("");
  const [baptismDate, setBaptismDate] = useState("");
  const [anniversary, setAnniversary] = useState("");

  // ── Contact form ────────────────────────────────────────────────
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // ── Preferences ─────────────────────────────────────────────────
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [publicDirectory, setPublicDirectory] = useState(true);

  // ── Dirty form detection ────────────────────────────────────────
  const [savedSnapshot, setSavedSnapshot] = useState<FormSnapshot | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Family form ─────────────────────────────────────────────────
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRelationship, setAddMemberRelationship] = useState<FamilyRelationship>("spouse");
  const [addingMember, setAddingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // ── Ministry actions ────────────────────────────────────────────
  const [joiningMinistryId, setJoiningMinistryId] = useState<string | null>(null);

  // ── Auto-dismiss toast ──────────────────────────────────────────
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Populate form from profile ──────────────────────────────────
  function populateForm(p: Profile) {
    const fName = p.first_name || "";
    const lName = p.last_name || "";
    const ph = p.phone || "";
    const dob = p.date_of_birth || "";
    const gen = p.gender || "";
    const bio = p.about_bio || "";
    const bapt = p.baptism_date || "";
    const anniv = p.anniversary || "";
    const addr = p.address || "";
    const ct = p.city || "";
    const st = p.state || "";
    const zp = p.zip || "";
    const emName = p.emergency_contact_name || "";
    const emPhone = p.emergency_contact_phone || "";

    setFirstName(fName);
    setLastName(lName);
    setEmail(p.email || "");
    setPhone(ph);
    setDateOfBirth(dob);
    setGender(gen);
    setAboutBio(bio);
    setBaptismDate(bapt);
    setAnniversary(anniv);
    setAddress(addr);
    setCity(ct);
    setState(st);
    setZip(zp);
    setEmergencyName(emName);
    setEmergencyPhone(emPhone);

    // Preferences from profile
    const eNotifs = p.email_notifications !== false; // default true
    const sNotifs = p.sms_opt_in === true; // default false
    const pubDir = p.public_directory !== false; // default true
    setEmailNotifs(eNotifs);
    setSmsNotifs(sNotifs);
    setPublicDirectory(pubDir);

    // Store snapshot for dirty detection
    const snapshot: FormSnapshot = {
      firstName: fName,
      lastName: lName,
      phone: ph,
      dateOfBirth: dob,
      gender: gen,
      aboutBio: bio,
      baptismDate: bapt,
      anniversary: anniv,
      address: addr,
      city: ct,
      state: st,
      zip: zp,
      emergencyName: emName,
      emergencyPhone: emPhone,
      emailNotifs: eNotifs,
      smsNotifs: sNotifs,
      publicDirectory: pubDir,
    };
    setSavedSnapshot(snapshot);
  }

  // ── Get current form values as snapshot ─────────────────────────
  function getCurrentSnapshot(): FormSnapshot {
    return {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      aboutBio,
      baptismDate,
      anniversary,
      address,
      city,
      state,
      zip,
      emergencyName,
      emergencyPhone,
      emailNotifs,
      smsNotifs,
      publicDirectory,
    };
  }

  // ── Check if form is dirty ──────────────────────────────────────
  function isFormDirty(): boolean {
    if (!savedSnapshot) return false;
    return !isSnapshotEqual(getCurrentSnapshot(), savedSnapshot);
  }

  // ── Revert form to last saved snapshot ──────────────────────────
  function revertToSnapshot() {
    if (!savedSnapshot) return;
    setFirstName(savedSnapshot.firstName);
    setLastName(savedSnapshot.lastName);
    setPhone(savedSnapshot.phone);
    setDateOfBirth(savedSnapshot.dateOfBirth);
    setGender(savedSnapshot.gender);
    setAboutBio(savedSnapshot.aboutBio);
    setBaptismDate(savedSnapshot.baptismDate);
    setAnniversary(savedSnapshot.anniversary);
    setAddress(savedSnapshot.address);
    setCity(savedSnapshot.city);
    setState(savedSnapshot.state);
    setZip(savedSnapshot.zip);
    setEmergencyName(savedSnapshot.emergencyName);
    setEmergencyPhone(savedSnapshot.emergencyPhone);
    setEmailNotifs(savedSnapshot.emailNotifs);
    setSmsNotifs(savedSnapshot.smsNotifs);
    setPublicDirectory(savedSnapshot.publicDirectory);
  }

  // ── Tab change with dirty detection ─────────────────────────────
  function handleTabChange(newTab: string) {
    if (newTab === activeTab) return;
    if (isFormDirty()) {
      setPendingTab(newTab);
      setUnsavedDialogOpen(true);
    } else {
      setActiveTab(newTab);
    }
  }

  // ── Unsaved changes dialog: save and switch ─────────────────────
  async function handleSaveAndSwitch() {
    setUnsavedDialogOpen(false);
    // Determine which tab we are currently on and save accordingly
    if (activeTab === "personal") {
      await handleSavePersonal();
    } else if (activeTab === "contact") {
      await handleSaveContact();
    } else if (activeTab === "preferences") {
      handleSavePreferences();
    }
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }

  // ── Unsaved changes dialog: discard and switch ──────────────────
  function handleDiscardAndSwitch() {
    setUnsavedDialogOpen(false);
    revertToSnapshot();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  }

  // ── Fetch all data ──────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [profileRes, familyRes, ministriesRes] = await Promise.all([
        fetch("/api/portal/profile"),
        fetch("/api/portal/family"),
        fetch("/api/portal/ministries"),
      ]);

      if (!profileRes.ok) {
        const d = await profileRes.json();
        throw new Error(d.error || "Failed to fetch profile");
      }

      const profileData = await profileRes.json();
      setProfile(profileData.profile);
      populateForm(profileData.profile);

      if (familyRes.ok) {
        const familyData = await familyRes.json();
        setFamily(familyData.family);
        setFamilyMembers(familyData.members || []);
      }

      if (ministriesRes.ok) {
        const ministriesData = await ministriesRes.json();
        setMinistries(ministriesData.ministries || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Save personal info ──────────────────────────────────────────
  async function handleSavePersonal() {
    setSaving(true);
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          about_bio: aboutBio || null,
          baptism_date: baptismDate || null,
          anniversary: anniversary || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setProfile(data.profile);
      setEditMode(false);
      // Update saved snapshot
      setSavedSnapshot(getCurrentSnapshot());
      setToast({ type: "success", message: "Personal info updated." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Save contact info ───────────────────────────────────────────
  async function handleSaveContact() {
    setSaving(true);
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: address || null,
          city: city || null,
          state: state || null,
          zip: zip || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setProfile(data.profile);
      // Update saved snapshot
      setSavedSnapshot(getCurrentSnapshot());
      setToast({ type: "success", message: "Contact info updated." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Save preferences ───────────────────────────────────────────
  const [savingPreferences, setSavingPreferences] = useState(false);

  async function handleSavePreferences() {
    setSavingPreferences(true);
    try {
      const res = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_notifications: emailNotifs,
          sms_opt_in: smsNotifs,
          public_directory: publicDirectory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save preferences");
      setProfile(data.profile);
      setSavedSnapshot(getCurrentSnapshot());
      setToast({ type: "success", message: "Preferences saved successfully" });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSavingPreferences(false);
    }
  }

  // ── Create family ───────────────────────────────────────────────
  async function handleCreateFamily() {
    if (!newFamilyName.trim()) return;
    setCreatingFamily(true);
    try {
      const res = await fetch("/api/portal/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_name: newFamilyName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create family");
      setFamily(data.family);
      setNewFamilyName("");
      setToast({ type: "success", message: "Family group created!" });
      // Refetch to get full member list (including self as head)
      const familyRes = await fetch("/api/portal/family");
      if (familyRes.ok) {
        const fData = await familyRes.json();
        setFamily(fData.family);
        setFamilyMembers(fData.members || []);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create family",
      });
    } finally {
      setCreatingFamily(false);
    }
  }

  // ── Add family member ───────────────────────────────────────────
  async function handleAddFamilyMember() {
    if (!addMemberEmail.trim()) return;
    setAddingMember(true);
    try {
      // For now we pass the email as profile_id; the API expects profile_id.
      // A real search would look up the profile by email first.
      // We'll pass it and let the API respond with errors if not found.
      const res = await fetch("/api/portal/family/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: addMemberEmail.trim(),
          relationship: addMemberRelationship,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add member");
      setAddMemberEmail("");
      setToast({ type: "success", message: "Family member added!" });
      // Refetch family
      const familyRes = await fetch("/api/portal/family");
      if (familyRes.ok) {
        const fData = await familyRes.json();
        setFamilyMembers(fData.members || []);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to add member",
      });
    } finally {
      setAddingMember(false);
    }
  }

  // ── Remove family member ────────────────────────────────────────
  async function handleRemoveFamilyMember(memberId: string) {
    setRemovingMemberId(memberId);
    try {
      const res = await fetch("/api/portal/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      setFamilyMembers((prev) => prev.filter((m) => m.id !== memberId));
      setToast({ type: "success", message: "Family member removed." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove member",
      });
    } finally {
      setRemovingMemberId(null);
    }
  }

  // ── Join ministry ───────────────────────────────────────────────
  async function handleJoinMinistry(ministryId: string) {
    setJoiningMinistryId(ministryId);
    try {
      const res = await fetch("/api/portal/ministries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministry_id: ministryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join ministry");
      // Update local state
      setMinistries((prev) =>
        prev.map((m) =>
          m.id === ministryId
            ? { ...m, user_status: "pending" as MinistryMemberStatus, user_role: "member" as MinistryRole }
            : m
        )
      );
      setToast({ type: "success", message: "Join request submitted!" });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to join ministry",
      });
    } finally {
      setJoiningMinistryId(null);
    }
  }

  // ── Determine if current user is family head ────────────────────
  const isHead = familyMembers.some(
    (m) => m.profile_id === profile?.id && m.relationship === "head"
  );

  // ── Giving data (mock) ──────────────────────────────────────────
  const donations: Donation[] = MOCK_DONATIONS;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const ytdTotal = donations
    .filter((d) => new Date(d.date).getFullYear() === currentYear)
    .reduce((sum, d) => sum + d.amount, 0);

  const monthTotal = donations
    .filter((d) => {
      const dt = new Date(d.date);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    })
    .reduce((sum, d) => sum + d.amount, 0);

  const lastGift = donations.length > 0
    ? donations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-warm-500">Loading your profile...</span>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
        <p className="text-warm-700 font-medium mb-2">Could not load profile</p>
        <p className="text-warm-500 text-sm mb-4">{error || "Profile not found"}</p>
        <Button
          onClick={() => {
            setLoading(true);
            fetchData();
          }}
          variant="outline"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // ── Family tree helper: organize members by relationship ────────
  function getFamilyMembersByRelationship(rel: FamilyRelationship) {
    return familyMembers.filter((m) => m.relationship === rel);
  }

  const heads = getFamilyMembersByRelationship("head");
  const spouses = getFamilyMembersByRelationship("spouse");
  const children = getFamilyMembersByRelationship("child");
  const parents = getFamilyMembersByRelationship("parent");
  const grandparents = getFamilyMembersByRelationship("grandparent");
  const grandchildren = getFamilyMembersByRelationship("grandchild");
  const siblings = getFamilyMembersByRelationship("sibling");
  const others = getFamilyMembersByRelationship("other");

  // ── Render helper: member name from profile join ────────────────
  function memberName(m: FamilyMemberWithProfile) {
    if (m.profiles) {
      return `${m.profiles.first_name} ${m.profiles.last_name}`;
    }
    if (m.first_name && m.last_name) {
      return `${m.first_name} ${m.last_name}`;
    }
    return "Unknown";
  }

  function memberInitials(m: FamilyMemberWithProfile) {
    if (m.profiles) {
      return getInitials(m.profiles.first_name, m.profiles.last_name);
    }
    return getInitials(m.first_name, m.last_name);
  }

  // ── Render ──────────────────────────────────────────────────────
  const initials = getInitials(profile.first_name, profile.last_name);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && <ToastBanner toast={toast} />}

      {/* ── Profile Header Card ──────────────────────────────────── */}
      <FadeIn direction="up">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar with upload */}
            <div className="flex flex-col items-center">
              <ProfilePictureUpload
                currentPhotoUrl={profile.photo_url}
                initials={initials}
                onSave={async (croppedDataUrl) => {
                  // Optimistically show the new image
                  setProfile({ ...profile, photo_url: croppedDataUrl });
                  setUploadingAvatar(true);
                  try {
                    const res = await fetch("/api/portal/profile/avatar", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ image: croppedDataUrl }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Upload failed");
                    // Update profile with the persistent URL from storage
                    setProfile(data.profile);
                    setToast({ type: "success", message: "Profile picture saved!" });
                  } catch (err) {
                    setToast({
                      type: "error",
                      message: err instanceof Error ? err.message : "Failed to save profile picture",
                    });
                    // Revert optimistic update on failure - refetch profile
                    const refetchRes = await fetch("/api/portal/profile");
                    if (refetchRes.ok) {
                      const refetchData = await refetchRes.json();
                      setProfile(refetchData.profile);
                    }
                  } finally {
                    setUploadingAvatar(false);
                  }
                }}
              />
              {uploadingAvatar && (
                <span className="mt-1 text-xs text-purple-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Uploading...
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-fluid-2xl text-warm-800">
                {profile.first_name} {profile.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  className={`capitalize ${
                    ROLE_BADGE_COLORS[profile.role] || "bg-blue-100 text-blue-800"
                  }`}
                >
                  {profile.role.replace("_", " ")}
                </Badge>
                <span className="text-sm text-warm-500">
                  Member since{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(profile.created_at))}
                </span>
              </div>
              {profile.ward_id && (
                <p className="text-sm text-warm-500 mt-1">
                  Ward: {profile.ward_id}
                </p>
              )}
            </div>

            {/* Edit / Save / Cancel Button */}
            {editMode ? (
              <div className="flex items-center gap-2 shrink-0">
                {isFormDirty() ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        revertToSnapshot();
                        setEditMode(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={async () => {
                        if (activeTab === "personal") await handleSavePersonal();
                        else if (activeTab === "contact") await handleSaveContact();
                        else if (activeTab === "preferences") handleSavePreferences();
                      }}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      ) : (
                        <Check className="h-4 w-4 mr-1.5" />
                      )}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditMode(false);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Cancel Edit
                  </Button>
                )}
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setEditMode(true);
                  setActiveTab("personal");
                }}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Profile
              </Button>
            )}
          </div>
        </Card>
      </FadeIn>

      {/* ── Tabbed Content ───────────────────────────────────────── */}
      <FadeIn direction="up" delay={0.1}>
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-6 h-auto">
              <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm">
                <User className="h-4 w-4 hidden sm:block" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm">
                <Heart className="h-4 w-4 hidden sm:block" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-1.5 text-xs sm:text-sm">
                <Users className="h-4 w-4 hidden sm:block" />
                Family
              </TabsTrigger>
              <TabsTrigger value="ministries" className="gap-1.5 text-xs sm:text-sm">
                <Church className="h-4 w-4 hidden sm:block" />
                Ministries
              </TabsTrigger>
              <TabsTrigger value="giving" className="gap-1.5 text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 hidden sm:block" />
                Giving
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm">
                <Settings className="h-4 w-4 hidden sm:block" />
                Preferences
              </TabsTrigger>
            </TabsList>

            {/* ════════════════════════════════════════════════════════
                Tab 1: Personal Info
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={!editMode}
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
                    disabled={!editMode}
                    placeholder="(843) 555-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={gender}
                    onValueChange={setGender}
                    disabled={!editMode}
                  >
                    <SelectTrigger id="gender">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="aboutBio">About / Bio</Label>
                  <Textarea
                    id="aboutBio"
                    rows={3}
                    value={aboutBio}
                    onChange={(e) => setAboutBio(e.target.value)}
                    disabled={!editMode}
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baptismDate">Baptism Date</Label>
                  <Input
                    id="baptismDate"
                    type="date"
                    value={baptismDate}
                    onChange={(e) => setBaptismDate(e.target.value)}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="anniversary">Anniversary</Label>
                  <Input
                    id="anniversary"
                    type="date"
                    value={anniversary}
                    onChange={(e) => setAnniversary(e.target.value)}
                    disabled={!editMode}
                  />
                </div>
              </div>
              {editMode && (
                <div className="mt-6 flex items-center gap-3">
                  <Button
                    className="bg-purple-700 hover:bg-purple-800"
                    onClick={handleSavePersonal}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab 2: Contact & Address
                ════════════════════════════════════════════════════════ */}
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
                    placeholder="Beaufort"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="SC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="29907"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                  <h3 className="font-medium text-warm-800 mb-3">Emergency Contact</h3>
                </div>
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
                  onClick={handleSaveContact}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab 3: Family
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="family">
              {!family ? (
                /* ── No family: show create ─────────────────────────── */
                <div className="text-center py-10">
                  <Users className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                  <h3 className="font-medium text-warm-700 mb-2">
                    No Family Group Yet
                  </h3>
                  <p className="text-sm text-warm-500 mb-4">
                    Create a family group to connect with your family members.
                  </p>
                  <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                    <Input
                      value={newFamilyName}
                      onChange={(e) => setNewFamilyName(e.target.value)}
                      placeholder="e.g. The Smith Family"
                      className="flex-1"
                    />
                    <Button
                      className="bg-purple-700 hover:bg-purple-800"
                      onClick={handleCreateFamily}
                      disabled={creatingFamily || !newFamilyName.trim()}
                    >
                      {creatingFamily ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-1" />
                      )}
                      Create
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Has family ─────────────────────────────────────── */
                <div className="space-y-6">
                  {/* Family name header */}
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-700" />
                    <h3 className="font-heading font-bold text-lg text-warm-800">
                      {family.family_name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {familyMembers.length} member{familyMembers.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  {/* Family member cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {familyMembers.map((m) => {
                      const name = memberName(m);
                      const mi = memberInitials(m);
                      const memberEmail = m.profiles?.email || m.email || "";
                      const memberPhone = m.profiles?.phone || m.phone || "";
                      const memberPhoto = m.profiles?.photo_url || m.photo_url;

                      return (
                        <Card
                          key={m.id}
                          className="p-4 flex items-start gap-3 relative"
                        >
                          {/* Avatar */}
                          {memberPhoto ? (
                            <img
                              src={memberPhoto}
                              alt={name}
                              className="h-10 w-10 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {mi}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {m.relationship === "head" && (
                                <Crown className="h-4 w-4 text-amber-500" />
                              )}
                              <span className="font-medium text-warm-800 text-sm truncate">
                                {name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-0.5"
                            >
                              {RELATIONSHIP_LABELS[m.relationship] || m.relationship}
                            </Badge>
                            {memberPhone && (
                              <p className="text-xs text-warm-500 mt-1 truncate">
                                {memberPhone}
                              </p>
                            )}
                            {memberEmail && (
                              <p className="text-xs text-warm-500 truncate">
                                {memberEmail}
                              </p>
                            )}
                          </div>
                          {/* Remove button (head only, can't remove self) */}
                          {isHead && m.relationship !== "head" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-7 w-7 p-0 text-warm-400 hover:text-red-500"
                              onClick={() => handleRemoveFamilyMember(m.id)}
                              disabled={removingMemberId === m.id}
                              title="Remove from family"
                            >
                              {removingMemberId === m.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>

                  {/* ── Visual Family Tree ──────────────────────────── */}
                  {familyMembers.length > 0 && (
                    <div className="border rounded-lg p-6 bg-warm-50/50">
                      <h4 className="font-medium text-warm-700 mb-4 text-center">
                        Family Tree
                      </h4>
                      <div className="flex flex-col items-center gap-0">
                        {/* Grandparents row */}
                        {grandparents.length > 0 && (
                          <>
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {grandparents.map((gp) => (
                                <TreeNode
                                  key={gp.id}
                                  name={memberName(gp)}
                                  initials={memberInitials(gp)}
                                  relationship="Grandparent"
                                  photo={gp.profiles?.photo_url || gp.photo_url}
                                />
                              ))}
                            </div>
                            <div className="w-px h-6 bg-warm-300" />
                          </>
                        )}

                        {/* Parents row */}
                        {parents.length > 0 && (
                          <>
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {parents.map((p) => (
                                <TreeNode
                                  key={p.id}
                                  name={memberName(p)}
                                  initials={memberInitials(p)}
                                  relationship="Parent"
                                  photo={p.profiles?.photo_url || p.photo_url}
                                />
                              ))}
                            </div>
                            <div className="w-px h-6 bg-warm-300" />
                          </>
                        )}

                        {/* Head + Spouse row */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {heads.map((h) => (
                            <TreeNode
                              key={h.id}
                              name={memberName(h)}
                              initials={memberInitials(h)}
                              relationship="Head"
                              photo={h.profiles?.photo_url || h.photo_url}
                              isHead
                            />
                          ))}
                          {spouses.length > 0 && (
                            <>
                              <div className="w-8 h-px bg-purple-400 hidden sm:block" />
                              <span className="text-purple-400 text-xs sm:hidden">---</span>
                            </>
                          )}
                          {spouses.map((s) => (
                            <TreeNode
                              key={s.id}
                              name={memberName(s)}
                              initials={memberInitials(s)}
                              relationship="Spouse"
                              photo={s.profiles?.photo_url || s.photo_url}
                            />
                          ))}
                        </div>

                        {/* Children row */}
                        {children.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-warm-300" />
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {children.map((c) => (
                                <TreeNode
                                  key={c.id}
                                  name={memberName(c)}
                                  initials={memberInitials(c)}
                                  relationship="Child"
                                  photo={c.profiles?.photo_url || c.photo_url}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Grandchildren row */}
                        {grandchildren.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-warm-300" />
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {grandchildren.map((gc) => (
                                <TreeNode
                                  key={gc.id}
                                  name={memberName(gc)}
                                  initials={memberInitials(gc)}
                                  relationship="Grandchild"
                                  photo={gc.profiles?.photo_url || gc.photo_url}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Siblings row */}
                        {siblings.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-warm-300" />
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {siblings.map((s) => (
                                <TreeNode
                                  key={s.id}
                                  name={memberName(s)}
                                  initials={memberInitials(s)}
                                  relationship="Sibling"
                                  photo={s.profiles?.photo_url || s.photo_url}
                                />
                              ))}
                            </div>
                          </>
                        )}

                        {/* Others row */}
                        {others.length > 0 && (
                          <>
                            <div className="w-px h-6 bg-warm-300" />
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                              {others.map((o) => (
                                <TreeNode
                                  key={o.id}
                                  name={memberName(o)}
                                  initials={memberInitials(o)}
                                  relationship="Other"
                                  photo={o.profiles?.photo_url || o.photo_url}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Add family member (head only) ───────────────── */}
                  {isHead && (
                    <div className="border rounded-lg p-4 bg-warm-50/30">
                      <h4 className="font-medium text-warm-700 mb-3 flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Family Member
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={addMemberEmail}
                          onChange={(e) => setAddMemberEmail(e.target.value)}
                          placeholder="Member's profile ID or email"
                          className="flex-1"
                        />
                        <Select
                          value={addMemberRelationship}
                          onValueChange={(v) =>
                            setAddMemberRelationship(v as FamilyRelationship)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[160px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {RELATIONSHIP_LABELS[r]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          className="bg-purple-700 hover:bg-purple-800"
                          onClick={handleAddFamilyMember}
                          disabled={addingMember || !addMemberEmail.trim()}
                        >
                          {addingMember ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          Add
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab 4: Ministries
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="ministries">
              {ministries.length === 0 ? (
                <div className="text-center py-10">
                  <Church className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                  <p className="text-warm-500">No ministries available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ministries.map((ministry) => (
                    <Card key={ministry.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-warm-800">
                            {ministry.name}
                          </h4>
                          {ministry.description && (
                            <p className="text-sm text-warm-500 mt-1 line-clamp-2">
                              {ministry.description}
                            </p>
                          )}
                          {ministry.schedule && (
                            <p className="text-xs text-warm-400 mt-1">
                              {ministry.schedule}
                            </p>
                          )}
                        </div>

                        {/* Status / Action */}
                        <div className="shrink-0">
                          {ministry.user_status === null ? (
                            <Button
                              size="sm"
                              className="bg-purple-700 hover:bg-purple-800"
                              onClick={() => handleJoinMinistry(ministry.id)}
                              disabled={joiningMinistryId === ministry.id}
                            >
                              {joiningMinistryId === ministry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5 mr-1" />
                                  Join
                                </>
                              )}
                            </Button>
                          ) : ministry.user_status === "pending" ? (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </Badge>
                          ) : ministry.user_status === "approved" ? (
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-green-100 text-green-800">
                                Active Member
                              </Badge>
                              {ministry.user_role && (
                                <span className="text-xs text-warm-500 capitalize">
                                  {ministry.user_role}
                                </span>
                              )}
                              {ministry.user_role === "manager" && (
                                <Link
                                  href={`/admin/ministries/${ministry.id}`}
                                  className="text-xs text-purple-600 hover:underline"
                                >
                                  Manage
                                </Link>
                              )}
                            </div>
                          ) : ministry.user_status === "denied" ? (
                            <div className="flex flex-col items-end gap-1">
                              <Badge className="bg-red-100 text-red-800">
                                Not Approved
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-6 px-2"
                                onClick={() => handleJoinMinistry(ministry.id)}
                                disabled={joiningMinistryId === ministry.id}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Re-request
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab 5: Giving Summary
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="giving">
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 text-center">
                  <p className="text-xs text-warm-500 uppercase tracking-wider">
                    Year-to-Date
                  </p>
                  <p className="text-2xl font-bold text-warm-800 mt-1">
                    {formatCurrency(ytdTotal)}
                  </p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-warm-500 uppercase tracking-wider">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-warm-800 mt-1">
                    {formatCurrency(monthTotal)}
                  </p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-xs text-warm-500 uppercase tracking-wider">
                    Last Gift
                  </p>
                  <p className="text-2xl font-bold text-warm-800 mt-1">
                    {lastGift ? formatCurrency(lastGift.amount) : "--"}
                  </p>
                  {lastGift && (
                    <p className="text-xs text-warm-400 mt-0.5">
                      {shortDate(lastGift.date)}
                    </p>
                  )}
                </Card>
              </div>

              {/* Giving history table */}
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-warm-50 text-warm-600">
                      <th className="text-left px-4 py-2 font-medium">Date</th>
                      <th className="text-left px-4 py-2 font-medium">Amount</th>
                      <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">
                        Type
                      </th>
                      <th className="text-left px-4 py-2 font-medium hidden md:table-cell">
                        Campaign
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-warm-400"
                        >
                          No giving history yet.
                        </td>
                      </tr>
                    ) : (
                      donations.map((d) => (
                        <tr
                          key={d.id}
                          className="border-t border-warm-100 hover:bg-warm-50/50"
                        >
                          <td className="px-4 py-2.5 text-warm-700">
                            {shortDate(d.date)}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-warm-800">
                            {formatCurrency(d.amount)}
                          </td>
                          <td className="px-4 py-2.5 text-warm-600 hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {DONATION_TYPE_LABELS[d.donation_type] || d.donation_type}
                            </Badge>
                          </td>
                          <td className="px-4 py-2.5 text-warm-500 hidden md:table-cell">
                            {d.campaign || "--"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Links */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Link href="/portal/giving">
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-1.5" />
                    Full Giving History
                  </Button>
                </Link>
                <Link href="/give">
                  <Button
                    size="sm"
                    className="bg-purple-700 hover:bg-purple-800"
                  >
                    <Heart className="h-4 w-4 mr-1.5" />
                    Make a Donation
                  </Button>
                </Link>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab 6: Preferences
                ════════════════════════════════════════════════════════ */}
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
                      SMS Text Messages
                    </p>
                    <p className="text-sm text-warm-500">
                      Opt in to receive text messages from the church (announcements, events, prayer alerts)
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
                  onClick={handleSavePreferences}
                  disabled={savingPreferences}
                >
                  {savingPreferences ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {savingPreferences ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </FadeIn>

      {/* ── Unsaved Changes Confirmation Dialog ─────────────────── */}
      <AlertDialog
        open={unsavedDialogOpen}
        onOpenChange={setUnsavedDialogOpen}
        title="Unsaved Changes"
        description="You have unsaved changes. Would you like to save them before leaving this tab?"
        confirmLabel="Save"
        cancelLabel="Discard"
        onConfirm={handleSaveAndSwitch}
        onCancel={handleDiscardAndSwitch}
      />
    </div>
  );
}

// ── Tree Node Component ─────────────────────────────────────────────

function TreeNode({
  name,
  initials,
  relationship,
  photo,
  isHead = false,
}: {
  name: string;
  initials: string;
  relationship: string;
  photo?: string | null;
  isHead?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className={`h-12 w-12 rounded-full object-cover border-2 ${
              isHead ? "border-amber-400" : "border-purple-200"
            }`}
          />
        ) : (
          <div
            className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold ${
              isHead
                ? "bg-amber-100 text-amber-700 border-2 border-amber-400"
                : "bg-purple-100 text-purple-700 border-2 border-purple-200"
            }`}
          >
            {initials}
          </div>
        )}
        {isHead && (
          <Crown className="h-3.5 w-3.5 text-amber-500 absolute -top-1.5 -right-1.5" />
        )}
      </div>
      <span className="text-xs font-medium text-warm-700 text-center max-w-[80px] truncate">
        {name}
      </span>
      <span className="text-[10px] text-warm-400">{relationship}</span>
    </div>
  );
}

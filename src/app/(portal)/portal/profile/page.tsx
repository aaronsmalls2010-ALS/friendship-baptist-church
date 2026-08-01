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
  Plus,
  UserPlus,
  RefreshCw,
  User,
  CheckCircle,
  Shield,
  Phone,
  Mail,
  Baby,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/motion/fade-in";
import { ProfilePictureUpload } from "@/components/portal/profile-picture-upload";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/utils";
import type {
  Profile,
  Ministry,
  MinistryMemberStatus,
  MinistryRole,
  Donation,
} from "@/types";

// ── Extended types for API responses ────────────────────────────────

// ── Families (multi-family, open self-join) ──────────────────────────
interface PortalFamilyMember {
  profile_id: string;
  relationship: string | null;
  profiles?: { first_name?: string; last_name?: string; photo_url?: string } | null;
}
interface PortalFamily {
  id: string;
  name: string;
  relationship: string | null;
  members: PortalFamilyMember[];
}
interface DirectoryFamily {
  id: string;
  name: string;
  member_count: number;
  joined: boolean;
}

// ── Children / dependents ────────────────────────────────────────────
interface Child {
  id: string;
  first_name: string;
  last_name: string | null;
  birthdate: string | null;
  grade: string | null;
  allergies: string | null;
  notes: string | null;
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
  maritalStatus: string;
  occupation: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyPhone: string;
  preferredContact: string;
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
    a.maritalStatus === b.maritalStatus &&
    a.occupation === b.occupation &&
    a.address === b.address &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.emergencyName === b.emergencyName &&
    a.emergencyPhone === b.emergencyPhone &&
    a.preferredContact === b.preferredContact &&
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

// ── Helper: age from birthdate ──────────────────────────────────────

function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : null;
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
  const [myFamilies, setMyFamilies] = useState<PortalFamily[]>([]);
  const [directory, setDirectory] = useState<DirectoryFamily[]>([]);
  const [ministries, setMinistries] = useState<MinistryWithStatus[]>([]);
  const [wardInfo, setWardInfo] = useState<{
    ward: { id: string; name: string; description: string } | null;
    deacon: { id: string; first_name: string; last_name: string; phone: string; email: string; photo_url: string | null } | null;
    members: { id: string; first_name: string; last_name: string; phone: string; email: string; photo_url: string | null }[];
  }>({ ward: null, deacon: null, members: [] });

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
  const [maritalStatus, setMaritalStatus] = useState("");
  const [occupation, setOccupation] = useState("");

  // ── Contact form ────────────────────────────────────────────────
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [preferredContact, setPreferredContact] = useState("email");

  // ── Preferences ─────────────────────────────────────────────────
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [publicDirectory, setPublicDirectory] = useState(true);

  // ── Dirty form detection ────────────────────────────────────────
  const [savedSnapshot, setSavedSnapshot] = useState<FormSnapshot | null>(null);
  const [unsavedDialogOpen, setUnsavedDialogOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── Family actions ──────────────────────────────────────────────
  const [familyBusyId, setFamilyBusyId] = useState<string | null>(null);

  // ── Children / dependents ───────────────────────────────────────
  const [children, setChildren] = useState<Child[]>([]);
  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [savingChild, setSavingChild] = useState(false);
  const [childBusyId, setChildBusyId] = useState<string | null>(null);
  const [childToDelete, setChildToDelete] = useState<Child | null>(null);
  // Child form fields
  const [childFirstName, setChildFirstName] = useState("");
  const [childLastName, setChildLastName] = useState("");
  const [childBirthdate, setChildBirthdate] = useState("");
  const [childGrade, setChildGrade] = useState("");
  const [childAllergies, setChildAllergies] = useState("");
  const [childNotes, setChildNotes] = useState("");

  // ── Ministry actions ────────────────────────────────────────────
  const [joiningMinistryId, setJoiningMinistryId] = useState<string | null>(null);
  const [leavingMinistryId, setLeavingMinistryId] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);

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
    const marital = p.marital_status || "";
    const occ = p.occupation || "";
    const addr = p.address || "";
    const ct = p.city || "";
    const st = p.state || "";
    const zp = p.zip || "";
    const emName = p.emergency_contact_name || "";
    const emPhone = p.emergency_contact_phone || "";
    const prefContact = p.preferred_contact || "email";

    setFirstName(fName);
    setLastName(lName);
    setEmail(p.email || "");
    setPhone(ph);
    setDateOfBirth(dob);
    setGender(gen);
    setAboutBio(bio);
    setBaptismDate(bapt);
    setAnniversary(anniv);
    setMaritalStatus(marital);
    setOccupation(occ);
    setAddress(addr);
    setCity(ct);
    setState(st);
    setZip(zp);
    setEmergencyName(emName);
    setEmergencyPhone(emPhone);
    setPreferredContact(prefContact);

    // Preferences from profile
    const eNotifs = p.email_notifications !== false; // default true
    const sNotifs = p.sms_opt_in !== false; // default true
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
      maritalStatus: marital,
      occupation: occ,
      address: addr,
      city: ct,
      state: st,
      zip: zp,
      emergencyName: emName,
      emergencyPhone: emPhone,
      preferredContact: prefContact,
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
      maritalStatus,
      occupation,
      address,
      city,
      state,
      zip,
      emergencyName,
      emergencyPhone,
      preferredContact,
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
    setMaritalStatus(savedSnapshot.maritalStatus);
    setOccupation(savedSnapshot.occupation);
    setAddress(savedSnapshot.address);
    setCity(savedSnapshot.city);
    setState(savedSnapshot.state);
    setZip(savedSnapshot.zip);
    setEmergencyName(savedSnapshot.emergencyName);
    setEmergencyPhone(savedSnapshot.emergencyPhone);
    setPreferredContact(savedSnapshot.preferredContact);
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
      const [profileRes, familyRes, dirRes, ministriesRes, wardRes, givingRes, childrenRes] = await Promise.all([
        fetch("/api/portal/profile"),
        fetch("/api/portal/family"),
        fetch("/api/portal/family/directory"),
        fetch("/api/portal/ministries"),
        fetch("/api/portal/ward"),
        fetch("/api/portal/giving"),
        fetch("/api/portal/family/children"),
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
        setMyFamilies(familyData.families || []);
      }

      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setDirectory(dirData.families || []);
      }

      if (ministriesRes.ok) {
        const ministriesData = await ministriesRes.json();
        setMinistries(ministriesData.ministries || []);
      }

      if (wardRes.ok) {
        const wardData = await wardRes.json();
        setWardInfo(wardData);
      }

      if (givingRes.ok) {
        const givingData = await givingRes.json();
        setDonations(givingData.donations || []);
      }

      if (childrenRes.ok) {
        const childrenData = await childrenRes.json();
        setChildren(childrenData.children || []);
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
          marital_status: maritalStatus || null,
          occupation: occupation || null,
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
          preferred_contact: preferredContact || null,
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

  // ── Refresh families + directory after a join/leave ─────────────
  async function refreshFamilyData() {
    const [familyRes, dirRes] = await Promise.all([
      fetch("/api/portal/family"),
      fetch("/api/portal/family/directory"),
    ]);
    if (familyRes.ok) {
      const d = await familyRes.json();
      setMyFamilies(d.families || []);
    }
    if (dirRes.ok) {
      const d = await dirRes.json();
      setDirectory(d.families || []);
    }
  }

  // ── Join an existing family (open self-join) ────────────────────
  async function handleJoinFamily(familyId: string) {
    setFamilyBusyId(familyId);
    try {
      const res = await fetch("/api/portal/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: familyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join family");
      setToast({ type: "success", message: "You've joined the family." });
      await refreshFamilyData();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to join family",
      });
    } finally {
      setFamilyBusyId(null);
    }
  }

  // ── Leave a family (self-remove) ────────────────────────────────
  async function handleLeaveFamily(familyId: string) {
    if (!confirm("Leave this family? You can rejoin anytime.")) return;
    setFamilyBusyId(familyId);
    try {
      const res = await fetch("/api/portal/family/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: familyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave family");
      setToast({ type: "success", message: "You've left the family." });
      await refreshFamilyData();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to leave family",
      });
    } finally {
      setFamilyBusyId(null);
    }
  }

  // ── Refresh children after a create/edit/remove ─────────────────
  async function refreshChildren() {
    const res = await fetch("/api/portal/family/children");
    if (res.ok) {
      const d = await res.json();
      setChildren(d.children || []);
    }
  }

  // ── Open the child dialog to add a new child ────────────────────
  function openAddChild() {
    setEditingChild(null);
    setChildFirstName("");
    setChildLastName("");
    setChildBirthdate("");
    setChildGrade("");
    setChildAllergies("");
    setChildNotes("");
    setChildDialogOpen(true);
  }

  // ── Open the child dialog to edit an existing child ─────────────
  function openEditChild(child: Child) {
    setEditingChild(child);
    setChildFirstName(child.first_name || "");
    setChildLastName(child.last_name || "");
    setChildBirthdate(child.birthdate || "");
    setChildGrade(child.grade || "");
    setChildAllergies(child.allergies || "");
    setChildNotes(child.notes || "");
    setChildDialogOpen(true);
  }

  // ── Create or update a child ────────────────────────────────────
  async function handleSaveChild() {
    if (!childFirstName.trim()) {
      setToast({ type: "error", message: "First name is required." });
      return;
    }
    setSavingChild(true);
    try {
      const payload = {
        first_name: childFirstName.trim(),
        last_name: childLastName.trim() || null,
        birthdate: childBirthdate || null,
        grade: childGrade.trim() || null,
        allergies: childAllergies.trim() || null,
        notes: childNotes.trim() || null,
      };
      const url = editingChild
        ? `/api/portal/family/children/${editingChild.id}`
        : "/api/portal/family/children";
      const res = await fetch(url, {
        method: editingChild ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setChildDialogOpen(false);
      setToast({
        type: "success",
        message: editingChild ? "Child updated." : "Child added.",
      });
      await refreshChildren();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Save failed",
      });
    } finally {
      setSavingChild(false);
    }
  }

  // ── Remove a child (after confirmation) ─────────────────────────
  async function handleDeleteChild() {
    if (!childToDelete) return;
    const id = childToDelete.id;
    setChildToDelete(null);
    setChildBusyId(id);
    try {
      const res = await fetch(`/api/portal/family/children/${id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to remove");
      setToast({ type: "success", message: "Child removed." });
      await refreshChildren();
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to remove child",
      });
    } finally {
      setChildBusyId(null);
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

  // ── Leave ministry ──────────────────────────────────────────────
  async function handleLeaveMinistry(ministryId: string) {
    setLeavingMinistryId(ministryId);
    try {
      const res = await fetch("/api/portal/ministries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ministry_id: ministryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to leave ministry");
      setMinistries((prev) =>
        prev.map((m) =>
          m.id === ministryId
            ? { ...m, user_status: null, user_role: null }
            : m
        )
      );
      setToast({ type: "success", message: "You have left the ministry." });
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to leave ministry",
      });
    } finally {
      setLeavingMinistryId(null);
    }
  }

  // ── Giving data ────────────────────────────────────────────────
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

  // ── Render helpers for family members ───────────────────────────
  function memberName(m: PortalFamilyMember) {
    const first = m.profiles?.first_name ?? "";
    const last = m.profiles?.last_name ?? "";
    return `${first} ${last}`.trim() || "Member";
  }

  function memberInitials(m: PortalFamilyMember) {
    return getInitials(m.profiles?.first_name ?? "", m.profiles?.last_name ?? "");
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
                  Ward: {profile.ward_name ?? profile.ward_id}
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
            <TabsList className="flex flex-wrap w-full mb-6 h-auto gap-1">
              <TabsTrigger value="personal" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <User className="h-4 w-4 hidden sm:block" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="contact" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <Heart className="h-4 w-4 hidden sm:block" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <Users className="h-4 w-4 hidden sm:block" />
                Family
              </TabsTrigger>
              <TabsTrigger value="ward" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <Shield className="h-4 w-4 hidden sm:block" />
                Ward
              </TabsTrigger>
              <TabsTrigger value="ministries" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <Church className="h-4 w-4 hidden sm:block" />
                Ministries
              </TabsTrigger>
              <TabsTrigger value="giving" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
                <DollarSign className="h-4 w-4 hidden sm:block" />
                Giving
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5 text-xs sm:text-sm flex-1 min-w-[80px]">
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
                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status</Label>
                  <Select
                    value={maritalStatus}
                    onValueChange={setMaritalStatus}
                    disabled={!editMode}
                  >
                    <SelectTrigger id="maritalStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="prefer_not_to_say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    disabled={!editMode}
                    placeholder="e.g. Teacher"
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
                <div className="sm:col-span-2 border-t pt-4 mt-2">
                  <h3 className="font-medium text-warm-800 mb-3">
                    Contact Preference
                  </h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferredContact">Preferred Contact Method</Label>
                  <Select
                    value={preferredContact}
                    onValueChange={setPreferredContact}
                  >
                    <SelectTrigger id="preferredContact">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
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
              <div className="space-y-8">
                {/* Children / dependents */}
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Baby className="h-5 w-5 text-purple-700" />
                      <h3 className="font-heading text-lg font-bold text-warm-800">
                        Children &amp; Dependents
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={openAddChild}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add child
                    </Button>
                  </div>
                  {children.length === 0 ? (
                    <p className="text-sm text-warm-500">
                      You haven&apos;t added any children yet. Use &ldquo;Add
                      child&rdquo; to list your dependents.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {children.map((child) => {
                        const age = ageFromBirthdate(child.birthdate);
                        const details = [
                          age !== null ? `Age ${age}` : null,
                          child.grade ? `Grade ${child.grade}` : null,
                        ].filter(Boolean);
                        return (
                          <div
                            key={child.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-warm-100 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                                {getInitials(child.first_name, child.last_name ?? "")}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-warm-800">
                                  {child.first_name} {child.last_name ?? ""}
                                </p>
                                {details.length > 0 && (
                                  <p className="truncate text-xs text-warm-400">
                                    {details.join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-warm-400 hover:text-purple-700"
                                onClick={() => openEditChild(child)}
                                disabled={childBusyId === child.id}
                                aria-label={`Edit ${child.first_name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-warm-400 hover:text-red-500"
                                onClick={() => setChildToDelete(child)}
                                disabled={childBusyId === child.id}
                                aria-label={`Remove ${child.first_name}`}
                              >
                                {childBusyId === child.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* My families */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-700" />
                    <h3 className="font-heading text-lg font-bold text-warm-800">
                      My Families
                    </h3>
                  </div>
                  {myFamilies.length === 0 ? (
                    <p className="text-sm text-warm-500">
                      You haven&apos;t joined any families yet. Find yours below.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {myFamilies.map((fam) => (
                        <Card key={fam.id} className="p-4">
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-warm-800">{fam.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {fam.members.length} member
                                {fam.members.length !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-warm-400 hover:text-red-500"
                              onClick={() => handleLeaveFamily(fam.id)}
                              disabled={familyBusyId === fam.id}
                            >
                              {familyBusyId === fam.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Leave"
                              )}
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {fam.members.map((m) => (
                              <div
                                key={m.profile_id}
                                className="flex items-center gap-3 rounded-lg border border-warm-100 p-2.5"
                              >
                                {m.profiles?.photo_url ? (
                                  <img
                                    src={m.profiles.photo_url}
                                    alt={memberName(m)}
                                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                                    {memberInitials(m)}
                                  </div>
                                )}
                                <span className="truncate text-sm text-warm-700">
                                  {memberName(m)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {/* Join a family */}
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-purple-700" />
                    <h3 className="font-heading text-lg font-bold text-warm-800">
                      Join a Family
                    </h3>
                  </div>
                  <p className="mb-3 text-sm text-warm-500">
                    Families are created by the church office. Find yours and join &mdash;
                    you&apos;ll only see a family&apos;s members after you join.
                  </p>
                  {directory.length === 0 ? (
                    <p className="text-sm text-warm-400">
                      No families have been set up yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {directory.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border border-warm-100 px-3 py-2.5"
                        >
                          <div>
                            <p className="text-sm font-medium text-warm-800">{d.name}</p>
                            <p className="text-xs text-warm-400">
                              {d.member_count} member{d.member_count !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {d.joined ? (
                            <Badge
                              variant="outline"
                              className="border-0 bg-green-50 text-xs text-green-700"
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Joined
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinFamily(d.id)}
                              disabled={familyBusyId === d.id}
                            >
                              {familyBusyId === d.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="mr-1 h-3.5 w-3.5" />
                                  Join
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab: Ward & Deacon
                ════════════════════════════════════════════════════════ */}
            <TabsContent value="ward">
              {!wardInfo.ward ? (
                <div className="text-center py-10">
                  <Shield className="h-12 w-12 text-warm-300 mx-auto mb-3" />
                  <p className="text-warm-500">You have not been assigned to a ward yet.</p>
                  <p className="text-sm text-warm-400 mt-1">Contact the church office to be assigned to a ward.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ward info */}
                  <div>
                    <h3 className="font-heading font-bold text-lg text-warm-800 mb-1">{wardInfo.ward.name}</h3>
                    {wardInfo.ward.description && (
                      <p className="text-sm text-warm-500">{wardInfo.ward.description}</p>
                    )}
                  </div>

                  {/* Deacon card */}
                  {wardInfo.deacon && (
                    <Card className="p-5 border-purple-200 bg-purple-50/50">
                      <h4 className="text-sm font-semibold text-purple-700 uppercase tracking-wider mb-3">Your Deacon</h4>
                      <div className="flex items-center gap-4">
                        {wardInfo.deacon.photo_url ? (
                          <img
                            src={wardInfo.deacon.photo_url}
                            alt={`${wardInfo.deacon.first_name} ${wardInfo.deacon.last_name}`}
                            className="h-14 w-14 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-lg shrink-0">
                            {getInitials(wardInfo.deacon.first_name, wardInfo.deacon.last_name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-warm-800 text-lg">
                            Deacon {wardInfo.deacon.first_name} {wardInfo.deacon.last_name}
                          </p>
                          {wardInfo.deacon.phone && (
                            <a href={`tel:${wardInfo.deacon.phone}`} className="flex items-center gap-1.5 text-sm text-purple-700 hover:underline mt-1">
                              <Phone className="h-3.5 w-3.5" />
                              {wardInfo.deacon.phone}
                            </a>
                          )}
                          {wardInfo.deacon.email && (
                            <a href={`mailto:${wardInfo.deacon.email}`} className="flex items-center gap-1.5 text-sm text-purple-700 hover:underline mt-0.5">
                              <Mail className="h-3.5 w-3.5" />
                              {wardInfo.deacon.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Ward members */}
                  {wardInfo.members.length > 0 && (
                    <div>
                      <h4 className="font-heading font-semibold text-warm-800 mb-3">
                        Ward Members ({wardInfo.members.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {wardInfo.members.map((m) => (
                          <Card key={m.id} className="p-4">
                            <div className="flex items-center gap-3">
                              {m.photo_url ? (
                                <img
                                  src={m.photo_url}
                                  alt={`${m.first_name} ${m.last_name}`}
                                  className="h-10 w-10 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-warm-200 flex items-center justify-center text-warm-600 font-bold text-sm shrink-0">
                                  {getInitials(m.first_name, m.last_name)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-warm-800 text-sm">
                                  {m.first_name} {m.last_name}
                                </p>
                                {m.phone && (
                                  <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-xs text-warm-500 hover:text-purple-600 mt-0.5">
                                    <Phone className="h-3 w-3" />
                                    {m.phone}
                                  </a>
                                )}
                                {m.email && (
                                  <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-xs text-warm-500 hover:text-purple-600 truncate">
                                    <Mail className="h-3 w-3 shrink-0" />
                                    {m.email}
                                  </a>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* ════════════════════════════════════════════════════════
                Tab: Ministries
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
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleLeaveMinistry(ministry.id)}
                                disabled={leavingMinistryId === ministry.id}
                              >
                                {leavingMinistryId === ministry.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Leave"
                                )}
                              </Button>
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

      {/* ── Add / Edit Child Dialog ─────────────────────────────── */}
      <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingChild ? "Edit Child" : "Add Child"}
            </DialogTitle>
            <DialogDescription>
              {editingChild
                ? "Update your child's details."
                : "Add a child or dependent to your family record."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="childFirstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="childFirstName"
                value={childFirstName}
                onChange={(e) => setChildFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childLastName">Last Name</Label>
              <Input
                id="childLastName"
                value={childLastName}
                onChange={(e) => setChildLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childBirthdate">Birthdate</Label>
              <Input
                id="childBirthdate"
                type="date"
                value={childBirthdate}
                onChange={(e) => setChildBirthdate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="childGrade">Grade</Label>
              <Input
                id="childGrade"
                value={childGrade}
                onChange={(e) => setChildGrade(e.target.value)}
                placeholder="e.g. 3rd"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="childAllergies">Allergies</Label>
              <Input
                id="childAllergies"
                value={childAllergies}
                onChange={(e) => setChildAllergies(e.target.value)}
                placeholder="Any allergies to note"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="childNotes">Notes</Label>
              <Textarea
                id="childNotes"
                rows={3}
                value={childNotes}
                onChange={(e) => setChildNotes(e.target.value)}
                placeholder="Anything the church should know"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setChildDialogOpen(false)}
              disabled={savingChild}
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-700 hover:bg-purple-800"
              onClick={handleSaveChild}
              disabled={savingChild}
            >
              {savingChild ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {editingChild ? "Save Changes" : "Add Child"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Child Confirmation Dialog ────────────────────── */}
      <AlertDialog
        open={childToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setChildToDelete(null);
        }}
        title="Remove Child"
        description={
          childToDelete
            ? `Remove ${childToDelete.first_name}${
                childToDelete.last_name ? " " + childToDelete.last_name : ""
              } from your family record? This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={handleDeleteChild}
        onCancel={() => setChildToDelete(null)}
      />
    </div>
  );
}

\
"use client";

import * as React from "react";
import { Building2, Loader2, PencilLine, Save, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProfile,
  updateProfile,
  type ProfileDto,
  type UpdateProfileDto,
} from "@/lib/api/profile-api-client";

type EditProfileDialogProps = {
  initialProfile?: ProfileDto | null;
  onUpdated?: (profile: ProfileDto) => void;
  triggerLabel?: string;
};

const FIELD_STYLES =
  "h-11 rounded-xl border-slate-200 bg-white focus-visible:ring-violet-500";

export function EditProfileDialog({
  initialProfile = null,
  onUpdated,
  triggerLabel = "Edit Profile",
}: EditProfileDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState<UpdateProfileDto>({
    firstName: "",
    lastName: "",
    institution: "",
    department: "",
    researchGroup: "",
    timezone: "",
  });

  const hydrateForm = React.useCallback((profile: ProfileDto) => {
    setForm({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      institution: profile.institution ?? "",
      department: profile.department ?? "",
      researchGroup: profile.researchGroup ?? "",
      timezone: profile.timezone ?? "",
    });
  }, []);

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      return;
    }

    setError(null);

    if (initialProfile) {
      hydrateForm(initialProfile);
      return;
    }

    setLoading(true);
    try {
      const profile = await getProfile();
      hydrateForm(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const setField =
    (key: keyof UpdateProfileDto) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        [key]: e.target.value,
      }));
    };

  const validate = () => {
    if (!form.firstName?.trim()) return "First name is required.";
    if (!form.lastName?.trim()) return "Surname is required.";
    if (!form.institution?.trim()) return "Institution is required.";
    if (!form.department?.trim()) return "Department is required.";
    if (!form.timezone?.trim()) return "Timezone is required.";
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await updateProfile({
        firstName: form.firstName?.trim(),
        lastName: form.lastName?.trim(),
        institution: form.institution?.trim(),
        department: form.department?.trim(),
        researchGroup: form.researchGroup?.trim(),
        timezone: form.timezone?.trim(),
      });

      onUpdated?.(updated);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PencilLine className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl rounded-3xl p-0 overflow-hidden">
        <div className="border-b bg-gradient-to-r from-indigo-50 via-violet-50 to-purple-50 px-6 py-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <UserCircle2 className="h-5 w-5 text-violet-600" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="pt-1">
              Update your research identity, institutional details, and profile metadata.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="flex items-center gap-3 rounded-2xl border bg-slate-50 px-4 py-6 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading profile details...
            </div>
          ) : (
            <div className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <UserCircle2 className="h-4 w-4 text-violet-600" />
                  Identity
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={form.firstName ?? ""}
                      onChange={setField("firstName")}
                      className={FIELD_STYLES}
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Surname</Label>
                    <Input
                      id="lastName"
                      value={form.lastName ?? ""}
                      onChange={setField("lastName")}
                      className={FIELD_STYLES}
                      placeholder="Enter surname"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <Building2 className="h-4 w-4 text-violet-600" />
                  Institutional Details
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution</Label>
                    <Input
                      id="institution"
                      value={form.institution ?? ""}
                      onChange={setField("institution")}
                      className={FIELD_STYLES}
                      placeholder="Enter institution or organization"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={form.department ?? ""}
                        onChange={setField("department")}
                        className={FIELD_STYLES}
                        placeholder="Enter department"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="researchGroup">Research Group</Label>
                      <Input
                        id="researchGroup"
                        value={form.researchGroup ?? ""}
                        onChange={setField("researchGroup")}
                        className={FIELD_STYLES}
                        placeholder="Enter lab or research group"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={form.timezone ?? ""}
                      onChange={setField("timezone")}
                      className={FIELD_STYLES}
                      placeholder="Example: America/New_York"
                    />
                    <p className="text-xs text-slate-500">
                      Must match the backend timezone format used by your profile API.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <DialogFooter className="border-t bg-slate-50 px-6 py-4">
          <div className="flex w-full flex-col gap-2-reverse sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Changes save to <span className="font-medium">PATCH /api/v1/profile</span>.
            </p>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * QUICK INTEGRATION
 *
 * 1) Put this file at:
 *    components/profile/edit-profile-dialog.tsx
 *
 * 2) Import into your profile page:
 *    import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
 *
 * 3) Replace the old Edit Profile button with:
 *
 *    <EditProfileDialog
 *      initialProfile={profile}
 *      onUpdated={(updated) => setProfile(updated)}
 *    />
 *
 * 4) Required API client:
 *    "@/lib/api/profile-api-client"
 */

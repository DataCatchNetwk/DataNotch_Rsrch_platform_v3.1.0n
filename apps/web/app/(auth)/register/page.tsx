"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { z } from "zod/v4";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const researcherApplicationSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Surname is required"),
    email: z.string().email("Enter a valid email address"),
    institutionEmail: z
      .string()
      .email("Enter a valid institutional email")
      .optional()
      .or(z.literal("")),
    phoneCode: z.string().min(1, "Code is required"),
    mobileNumber: z
      .string()
      .min(10, "Enter a valid phone number")
      .max(20, "Phone number is too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[0-9]/, "Must include a number"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),

    referralCode: z.string().optional(),

    institution: z.string().min(2, "Institution is required"),
    department: z.string().min(2, "Department / faculty is required"),
    roleTitle: z.string().min(2, "Role / title is required"),
    researcherType: z.string().min(1, "Researcher type is required"),
    country: z.string().min(2, "Country is required"),
    city: z.string().min(2, "City is required"),
    yearsOfExperience: z.string().min(1, "Select years of experience"),

    researchArea: z.string().min(3, "Research area is required"),
    shortBio: z
      .string()
      .min(20, "Short bio must be at least 20 characters")
      .max(500, "Short bio must be 500 characters or less"),
    researchInterests: z
      .string()
      .min(20, "Research interests must be at least 20 characters"),
    platformPurpose: z
      .string()
      .min(20, "Purpose of joining must be at least 20 characters"),
    expectedDatasets: z
      .string()
      .min(10, "Describe expected datasets or project types"),
    collaborationType: z.string().min(1, "Select collaboration type"),
    featureNeeds: z.array(z.string()).min(1, "Select at least one feature"),

    usesSensitiveData: z.string().min(1, "Please select an option"),
    irbRequired: z.string().min(1, "Please select an option"),
    irbProtocolNumber: z.string().optional(),
    dataSensitivityLevel: z
      .string()
      .min(1, "Select data sensitivity level"),
    fundingSource: z.string().optional(),
    supervisorName: z.string().min(2, "Supervisor / PI name is required"),
    supervisorEmail: z.string().email("Enter a valid supervisor email"),

    cvFile: z
      .any()
      .optional()
      .refine(
        (file) => !file || file instanceof File,
        "CV must be a valid file"
      )
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        "CV file must be less than 8MB"
      )
      .refine(
        (file) => !file || ALLOWED_FILE_TYPES.includes(file.type),
        "Unsupported CV file type"
      ),

    affiliationProofFile: z
      .any()
      .optional()
      .refine(
        (file) => !file || file instanceof File,
        "Proof of affiliation must be a valid file"
      )
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        "Proof of affiliation file must be less than 8MB"
      )
      .refine(
        (file) => !file || ALLOWED_FILE_TYPES.includes(file.type),
        "Unsupported proof file type"
      ),

    irbDocumentFile: z
      .any()
      .optional()
      .refine(
        (file) => !file || file instanceof File,
        "IRB document must be a valid file"
      )
      .refine(
        (file) => !file || file.size <= MAX_FILE_SIZE,
        "IRB document must be less than 8MB"
      )
      .refine(
        (file) => !file || ALLOWED_FILE_TYPES.includes(file.type),
        "Unsupported IRB file type"
      ),

    confirmAccuracy: z.boolean().refine((v) => v === true, {
      message: "You must confirm your information is accurate",
    }),
    agreeTerms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the terms and data policy",
    }),
    understandApproval: z.boolean().refine((v) => v === true, {
      message: "You must acknowledge the admin approval process",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    if (data.irbRequired === "yes" && !data.irbProtocolNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["irbProtocolNumber"],
        message: "IRB protocol number is required when IRB is needed",
      });
    }

    if (!data.institutionEmail?.trim() && !data.email.endsWith(".edu")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["institutionEmail"],
        message:
          "Provide an institutional email if your primary email is not institutional",
      });
    }
  });

type ResearcherApplicationFormValues = z.infer<
  typeof researcherApplicationSchema
>;

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "success";
      applicationId: string;
      applicantName: string;
      applicantEmail: string;
      institution: string;
      reviewEta: string;
    }
  | { status: "error"; message: string };

const FEATURE_OPTIONS = [
  { value: "dataset_upload", label: "Dataset Upload" },
  { value: "analysis_jobs", label: "Analysis Jobs" },
  { value: "reports_exports", label: "Reports & Exports" },
  { value: "workspace_collaboration", label: "Workspace Collaboration" },
  { value: "review_workflows", label: "Review Workflows" },
  { value: "notifications", label: "Notifications" },
];

export default function RegisterResearcherPage() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });

  const defaultValues: Partial<ResearcherApplicationFormValues> = useMemo(
    () => ({
      firstName: "",
      lastName: "",
      email: "",
      institutionEmail: "",
      phoneCode: "+1",
      mobileNumber: "",
      password: "",
      confirmPassword: "",
      referralCode: "",

      institution: "",
      department: "",
      roleTitle: "",
      researcherType: "",
      country: "",
      city: "",
      yearsOfExperience: "",

      researchArea: "",
      shortBio: "",
      researchInterests: "",
      platformPurpose: "",
      expectedDatasets: "",
      collaborationType: "",
      featureNeeds: [],

      usesSensitiveData: "",
      irbRequired: "",
      irbProtocolNumber: "",
      dataSensitivityLevel: "",
      fundingSource: "",
      supervisorName: "",
      supervisorEmail: "",

      cvFile: undefined,
      affiliationProofFile: undefined,
      irbDocumentFile: undefined,

      confirmAccuracy: false,
      agreeTerms: false,
      understandApproval: false,
    }),
    []
  );

  const form = useForm<ResearcherApplicationFormValues>({
    resolver: zodResolver(researcherApplicationSchema as never),
    defaultValues,
    mode: "onChange",
  });

  const irbRequired = form.watch("irbRequired");
  const values = form.watch();
  // cn kept for potential future use
  void cn;

  async function onSubmit(data: ResearcherApplicationFormValues) {
    try {
      setSubmissionState({ status: "loading" });

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value instanceof Date) {
          formData.append(key, value.toISOString());
        } else {
          formData.append(key, String(value ?? ""));
        }
      });

      // Replace with your real backend endpoint
      const response = await fetch("/api/v1/auth/register-researcher-application", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message ||
            "Unable to submit your application. Please try again."
        );
      }

      const result = await response.json();

      setSubmissionState({
        status: "success",
        applicationId: result.applicationId ?? "APP-2026-001",
        applicantName: `${data.firstName} ${data.lastName}`,
        applicantEmail: data.email,
        institution: data.institution,
        reviewEta: result.reviewEta ?? "2-5 business days",
      });

      form.reset(defaultValues);
    } catch (error) {
      setSubmissionState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your application.",
      });
    }
  }

  if (submissionState.status === "success") {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Card className="border-0 shadow-xl shadow-slate-200/60">
            <CardHeader className="pb-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                Application Submitted
              </CardTitle>
              <CardDescription className="text-base">
                Your researcher access request has been created and is now pending
                admin review.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoBox label="Applicant" value={submissionState.applicantName} />
                <InfoBox label="Email" value={submissionState.applicantEmail} />
                <InfoBox label="Institution" value={submissionState.institution} />
                <InfoBox
                  label="Application ID"
                  value={submissionState.applicationId}
                />
              </div>

              <div className="rounded-2xl border bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4" />
                  Status: Pending Admin Review
                </div>
                <p className="text-sm text-muted-foreground">
                  An administrator will review your application, verify your
                  institutional information, and determine whether to approve,
                  reject, or request more details.
                </p>
                <p className="mt-3 text-sm">
                  Estimated review time:{" "}
                  <span className="font-semibold">{submissionState.reviewEta}</span>
                </p>
              </div>

              <div className="rounded-2xl border bg-violet-50 p-4">
                <h3 className="font-semibold">What happens next?</h3>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Your account is created in pending status.</li>
                  <li>• The admin team reviews your application and documents.</li>
                  <li>• You will receive an email once a decision is made.</li>
                  <li>
                    • If approved, you may be asked to complete 2FA before full
                    access.
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" asChild>
                  <Link href="/">Go to Login</Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href="/support">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-violet-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            <UserPlus className="h-8 w-8" />
          </div>

          <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1">
            Admin approval required
          </Badge>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Apply for Researcher Access
          </h1>
          <p className="mt-2 text-muted-foreground">
            Join the Health Data Platform as a general researcher. Your application
            will remain pending until reviewed by an administrator.
          </p>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60">
          <CardHeader>
            <CardTitle>Researcher Registration & Application</CardTitle>
            <CardDescription>
              Complete your account information, research profile, compliance
              details, and supporting documents.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="mb-6 rounded-2xl border bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-medium text-amber-900">
                    Pending-approval access model
                  </p>
                  <p className="text-sm text-amber-800/80">
                    Submitting this form does not grant immediate access. Your
                    account will be created with a pending status and reviewed by
                    the admin team before activation.
                  </p>
                </div>
              </div>
            </div>

            {submissionState.status === "error" && (
              <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {submissionState.message}
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <section className="space-y-6">
                  <SectionHeader
                    title="Account Information"
                    description="Create your login credentials and primary contact details."
                    icon={<UserPlus className="h-5 w-5" />}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Surname</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter surname" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="name@example.com"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This email is used for login and application status
                            notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="institutionEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institutional Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="name@university.edu"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Strongly recommended for affiliation verification.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-[140px_1fr]">
                    <FormField
                      control={form.control}
                      name="phoneCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code</FormLabel>
                          <FormControl>
                            <Input placeholder="+1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobileNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="10-digit number"
                              autoComplete="tel"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            At least 8 characters with uppercase, lowercase, and a
                            number.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              max={new Date().toISOString().split("T")[0]}
                              min="1900-01-01"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter referral code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-6">
                  <SectionHeader
                    title="Institutional Information"
                    description="Provide the academic or professional details used for verification."
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="institution"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institution / Organization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Bowie State University"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department / Faculty / Lab</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Department of Computer Science"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="roleTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role / Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Graduate Researcher"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="researcherType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Researcher Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="general_researcher">
                                General Researcher
                              </SelectItem>
                              <SelectItem value="student_researcher">
                                Student Researcher
                              </SelectItem>
                              <SelectItem value="clinical_researcher">
                                Clinical Researcher
                              </SelectItem>
                              <SelectItem value="external_collaborator">
                                External Collaborator
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0-1">0-1 years</SelectItem>
                              <SelectItem value="2-4">2-4 years</SelectItem>
                              <SelectItem value="5-7">5-7 years</SelectItem>
                              <SelectItem value="8-10">8-10 years</SelectItem>
                              <SelectItem value="10+">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-6">
                  <SectionHeader
                    title="Research Application"
                    description="Tell us about your background, intended platform use, and collaboration needs."
                    icon={<FileText className="h-5 w-5" />}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="researchArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Research Area / Specialization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Health Informatics, Biostatistics"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="collaborationType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collaboration Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select collaboration type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solo">Solo Research</SelectItem>
                              <SelectItem value="team">Team-Based</SelectItem>
                              <SelectItem value="multi_institutional">
                                Multi-Institutional
                              </SelectItem>
                              <SelectItem value="sponsor_partner">
                                Sponsored / Partnered
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="shortBio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Summarize your academic/professional background"
                            className="min-h-27.5"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length ?? 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="researchInterests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Research Interests</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your active research interests"
                            className="min-h-30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="platformPurpose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Purpose of Joining the Platform</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain why you want access and how you expect to use the platform"
                            className="min-h-30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedDatasets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Datasets / Project Type</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the type of datasets or projects you expect to work with"
                            className="min-h-25"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featureNeeds"
                    render={() => (
                      <FormItem>
                        <div className="mb-3">
                          <FormLabel>Requested Platform Features</FormLabel>
                          <FormDescription>
                            Select the product capabilities you expect to use.
                          </FormDescription>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {FEATURE_OPTIONS.map((item) => (
                            <FormField
                              key={item.value}
                              control={form.control}
                              name="featureNeeds"
                              render={({ field }) => {
                                const checked = field.value?.includes(item.value);
                                return (
                                  <FormItem
                                    key={item.value}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={checked}
                                        onCheckedChange={(isChecked) => {
                                          return isChecked
                                            ? field.onChange([
                                                ...(field.value || []),
                                                item.value,
                                              ])
                                            : field.onChange(
                                                (field.value || []).filter(
                                                  (value) => value !== item.value
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="font-medium">
                                        {item.label}
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <Separator />

                <section className="space-y-6">
                  <SectionHeader
                    title="Compliance & Verification"
                    description="Provide data sensitivity and supervisory details for administrative review."
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="usesSensitiveData"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Will you upload human-subject or sensitive data?
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="not_sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="irbRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Is IRB / ethics approval required?</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="not_sure">Not sure</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {irbRequired === "yes" && (
                    <FormField
                      control={form.control}
                      name="irbProtocolNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IRB Protocol Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter IRB protocol number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dataSensitivityLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Sensitivity Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select classification" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="internal">Internal</SelectItem>
                              <SelectItem value="restricted">Restricted</SelectItem>
                              <SelectItem value="de_identified_health">
                                De-identified Health Data
                              </SelectItem>
                              <SelectItem value="phi_like">
                                PHI-like / Regulated
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundingSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Source (optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Grant, department, sponsor, self-funded"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="supervisorName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor / Principal Investigator</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter supervisor or PI name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supervisorEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supervisor / PI Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="supervisor@institution.edu"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>

                <Separator />

                <section className="space-y-6">
                  <SectionHeader
                    title="Supporting Documents"
                    description="Upload files that help administrators verify your eligibility."
                    icon={<FileText className="h-5 w-5" />}
                  />

                  <div className="grid gap-6 md:grid-cols-2">
                    <FileUploadField
                      form={form}
                      name="cvFile"
                      label="CV / Resume"
                      description="PDF, DOC, DOCX, JPG, PNG up to 8MB"
                    />

                    <FileUploadField
                      form={form}
                      name="affiliationProofFile"
                      label="Proof of Affiliation"
                      description="Institutional ID, offer letter, or departmental proof"
                    />
                  </div>

                  <FileUploadField
                    form={form}
                    name="irbDocumentFile"
                    label="IRB / Ethics Approval Document (optional)"
                    description="Attach when applicable"
                  />
                </section>

                <Separator />

                <section className="space-y-6">
                  <SectionHeader
                    title="Acknowledgment & Submission"
                    description="Confirm the application details and submit for administrative review."
                    icon={<ShieldCheck className="h-5 w-5" />}
                  />

                  <div className="space-y-4 rounded-2xl border bg-muted/30 p-5">
                    <FormField
                      control={form.control}
                      name="confirmAccuracy"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel>I confirm the information provided is accurate.</FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel>
                              I agree to the platform terms, privacy policy, and data
                              governance requirements.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="understandApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel>
                              I understand my account will remain pending until admin
                              approval is completed.
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-muted-foreground">
                    Submission outcome:
                    <span className="ml-2 font-medium text-foreground">
                      AccountStatus = PENDING_APPROVAL
                    </span>
                    <br />
                    Researcher Type:
                    <span className="ml-2 font-medium text-foreground">
                      {values.researcherType || "GENERAL_RESEARCHER"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1"
                      disabled={submissionState.status === "loading"}
                    >
                      {submissionState.status === "loading" ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>

                    <Button type="button" variant="outline" size="lg" className="flex-1">
                      Save Draft
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/" className="font-medium text-primary hover:underline">
                      Sign in
                    </Link>
                  </p>
                </section>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function FileUploadField({
  form,
  name,
  label,
  description,
}: {
  form: ReturnType<typeof useForm<ResearcherApplicationFormValues>>;
  name: "cvFile" | "affiliationProofFile" | "irbDocumentFile";
  label: string;
  description: string;
}) {
  const currentFile = form.watch(name) as File | undefined;

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                form.setValue(name, file, { shouldValidate: true });
              }}
            />
          </FormControl>
          <FormDescription>
            {description}
            {currentFile ? (
              <span className="ml-2 font-medium text-foreground">
                Selected: {currentFile.name}
              </span>
            ) : null}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

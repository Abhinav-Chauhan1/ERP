"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Building2, CreditCard, Check, Shield, Key, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  PLAN_LIMITS, PLAN_FEATURES, type PlanType, type FeatureKey,
  calcMonthlyBill,
} from "@/lib/config/plan-features";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlanFeatures {
  pricePerStudent:      number; // paise
  minimumMonthly:       number; // paise
  annualDiscountMonths: number;
  storageGB:            number;
  smsLimit:             number;
  whatsappLimit:        number;
  includedFeatures:     string[];
}

interface DbPlan {
  id:          string;
  name:        string;
  description: string | null;
  interval:    string;
  pricePerStudent: number; // paise — top-level column
  minimumMonthly:  number; // paise — top-level column
  annualDiscountMonths: number;
  features:    PlanFeatures;
  isActive:    boolean;
}

interface SchoolCreationData {
  schoolName:            string;
  schoolCode:            string;
  subdomain:             string;
  contactEmail:          string;
  contactPhone:          string;
  description:           string;
  subscriptionPlan:      string; // plan id
  enableOTPForAdmins:    boolean;
  authenticationMethod:  'password' | 'otp' | 'both';
  enableSubdomain:       boolean;
}

// ── Feature labels ────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<string, string> = {
  library:           'Library management',
  transport:         'Transport management',
  admissions:        'Admissions portal',
  bulk_messaging:    'Bulk SMS messaging',
  whatsapp:          'WhatsApp notifications',
  message_templates: 'Message templates',
  payroll:           'Payroll management',
  budget:            'Budget planning',
  finance_analytics: 'Finance analytics',
  advanced_reports:  'Advanced reports',
  id_cards:          'ID card generation',
  certificates:      'Certificate generation',
  hostel:            'Hostel management',
  alumni:            'Alumni portal',
  audit_logs:        'Audit logs',
  lms:               'LMS & online courses',
  study_tools:       'Student study tools',
};

// Features to show as "locked" on lower plans (top 3 missing)
const LOCKED_FEATURES: Record<string, { keys: FeatureKey[]; label: string }> = {
  STARTER:  { keys: ['library', 'transport', 'whatsapp'], label: 'Growth+' },
  GROWTH:   { keys: ['hostel', 'alumni', 'lms'],          label: 'Dominate+' },
  DOMINATE: { keys: [], label: '' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPricePerStudent(plan: DbPlan): number {
  // Prefer top-level column; fall back to features JSON; fall back to PLAN_LIMITS
  const fromCol  = plan.pricePerStudent;
  const fromJson = plan.features?.pricePerStudent;
  const fallback = PLAN_LIMITS[plan.name as PlanType]?.pricePerStudent ?? 4;
  const paise    = fromCol > 0 ? fromCol : (fromJson > 0 ? fromJson : fallback * 100);
  return paise / 100; // return INR
}

function getMinMonthly(plan: DbPlan): number {
  const fromCol  = plan.minimumMonthly;
  const fromJson = plan.features?.minimumMonthly;
  const fallback = PLAN_LIMITS[plan.name as PlanType]?.minMonthly ?? 500;
  const paise    = fromCol > 0 ? fromCol : (fromJson > 0 ? fromJson : fallback * 100);
  return paise / 100; // return INR
}

function getAnnualDiscountMonths(plan: DbPlan): number {
  return plan.annualDiscountMonths > 0
    ? plan.annualDiscountMonths
    : (plan.features?.annualDiscountMonths ?? 2);
}

function calcBill(plan: DbPlan, students: number): number {
  const pps = getPricePerStudent(plan);
  const min = getMinMonthly(plan);
  return Math.max(students * pps, min);
}

function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function getIncludedFeatures(plan: DbPlan): FeatureKey[] {
  // Always use PLAN_FEATURES config — not the stale DB JSON
  return PLAN_FEATURES[plan.name as PlanType] ?? plan.features?.includedFeatures ?? [];
}

// ── Plan Card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  annual,
  estimatedStudents,
  onSelect,
}: {
  plan: DbPlan;
  selected: boolean;
  annual: boolean;
  estimatedStudents: number;
  onSelect: () => void;
}) {
  const pps          = getPricePerStudent(plan);
  const minMonthly   = getMinMonthly(plan);
  const discountMo   = getAnnualDiscountMonths(plan);
  const monthlyBill  = calcBill(plan, estimatedStudents);
  const annualBill   = monthlyBill * (12 - discountMo);
  const annualSaving = monthlyBill * discountMo;
  const included     = getIncludedFeatures(plan);
  const locked       = LOCKED_FEATURES[plan.name as PlanType] ?? { keys: [], label: '' };
  const isNeedsSeeding = plan.pricePerStudent === 0 && (plan.features?.pricePerStudent ?? 0) === 0;

  const storageGB    = plan.features?.storageGB    ?? PLAN_LIMITS[plan.name as PlanType]?.storageGB    ?? 1;
  const smsLimit     = plan.features?.smsLimit     ?? PLAN_LIMITS[plan.name as PlanType]?.sms          ?? 500;
  const waLimit      = plan.features?.whatsappLimit ?? PLAN_LIMITS[plan.name as PlanType]?.whatsapp     ?? 0;

  return (
    <div
      onClick={onSelect}
      className={`relative border rounded-lg p-4 cursor-pointer transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--ring))]'
      }`}
    >
      {plan.name === 'GROWTH' && (
        <Badge className="absolute -top-2 left-4 bg-blue-600 text-xs">Recommended</Badge>
      )}
      {isNeedsSeeding && (
        <Badge className="absolute -top-2 right-4 bg-amber-500 text-xs">Needs seeding</Badge>
      )}

      <div className="space-y-3">
        <div>
          <Badge variant="outline" className="text-xs mb-1">{plan.name}</Badge>
          <h4 className="font-semibold text-base capitalize">{plan.name.toLowerCase()}</h4>
        </div>

        {/* Pricing */}
        <div>
          <div className="text-2xl font-bold">
            ₹{pps.toFixed(0)}
            <span className="text-sm font-normal text-muted-foreground"> /student/month</span>
          </div>
          <div className="text-xs text-muted-foreground">Min ₹{fmtINR(minMonthly)}/month</div>
        </div>

        {/* Bill preview */}
        <div className="bg-muted/50 rounded p-2 text-xs space-y-0.5">
          <div className="text-muted-foreground">{estimatedStudents} students →</div>
          {annual ? (
            <>
              <div className="font-medium">Annual: ₹{fmtINR(annualBill)}</div>
              <div className="text-emerald-600">
                Save ₹{fmtINR(annualSaving)} ({discountMo} months free)
              </div>
            </>
          ) : (
            <div className="font-medium">Monthly: ₹{fmtINR(monthlyBill)}</div>
          )}
        </div>

        {/* Limits */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <div>✓ {storageGB} GB storage</div>
          <div>✓ {smsLimit === -1 ? 'Unlimited' : `${smsLimit}`} SMS/month</div>
          {waLimit > 0
            ? <div>✓ {waLimit === -1 ? 'Unlimited' : waLimit} WhatsApp/month</div>
            : <div className="text-muted-foreground/60">✗ WhatsApp (Growth+)</div>
          }
        </div>

        <Separator />

        {/* Features */}
        <div className="text-xs space-y-0.5">
          {included.slice(0, 4).map(f => (
            <div key={f} className="flex items-center gap-1 text-green-600">
              <Check className="h-3 w-3 shrink-0" />
              {FEATURE_LABELS[f] ?? f}
            </div>
          ))}
          {included.length > 4 && (
            <div className="text-muted-foreground">+{included.length - 4} more features</div>
          )}
          {locked.keys.map(f => (
            <div key={f} className="flex items-center gap-1 text-muted-foreground/60">
              <X className="h-3 w-3 shrink-0" />
              {FEATURE_LABELS[f] ?? f}
              <span className="text-xs">({locked.label})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function SchoolCreationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading]           = useState(false);
  const [availablePlans, setAvailablePlans] = useState<DbPlan[]>([]);
  const [annual, setAnnual]                 = useState(false);
  const [estimatedStudents, setEstimatedStudents] = useState(300);

  const [formData, setFormData] = useState<SchoolCreationData>({
    schoolName:           '',
    schoolCode:           '',
    subdomain:            '',
    contactEmail:         '',
    contactPhone:         '',
    description:          '',
    subscriptionPlan:     '',
    enableOTPForAdmins:   false,
    authenticationMethod: 'password',
    enableSubdomain:      true,
  });

  const [subdomainAvailable, setSubdomainAvailable]   = useState<boolean | null>(null);
  const [checkingSubdomain, setCheckingSubdomain]     = useState(false);

  useEffect(() => { fetchAvailablePlans(); }, []);

  const fetchAvailablePlans = async () => {
    try {
      const res = await fetch('/api/super-admin/plans');
      if (res.ok) {
        const data = await res.json();
        const active: DbPlan[] = (data.plans ?? []).filter((p: DbPlan) => p.isActive);
        setAvailablePlans(active);
        if (active.length > 0) {
          const growth = active.find(p => p.name === 'GROWTH');
          setFormData(prev => ({ ...prev, subscriptionPlan: growth?.id ?? active[0].id }));
        }
      }
    } catch { /* silent */ }
  };

  const set = (field: keyof SchoolCreationData, value: string | number | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'schoolName' && !prev.schoolCode) {
        next.schoolCode = (value as string)
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .toUpperCase()
          .substring(0, 10);
      }
      if (field === 'subdomain') setSubdomainAvailable(null);
      if (field === 'enableSubdomain' && !value) {
        next.subdomain = '';
        setSubdomainAvailable(null);
      }
      return next;
    });
  };

  const checkSubdomain = async () => {
    if (!formData.subdomain) return;
    setCheckingSubdomain(true);
    try {
      const res = await fetch('/api/super-admin/schools/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: formData.subdomain }),
      });
      const result = await res.json();
      setSubdomainAvailable(result.available);
      if (!result.available) toast.error(result.message);
    } catch {
      setSubdomainAvailable(false);
      toast.error('Failed to check subdomain availability');
    } finally {
      setCheckingSubdomain(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          subdomain: formData.enableSubdomain ? formData.subdomain : '',
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create school');
      toast.success('School created successfully!');
      router.push(result.setupUrl);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create school');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = availablePlans.find(p => p.id === formData.subscriptionPlan);
  const monthlyBill  = selectedPlan ? calcBill(selectedPlan, estimatedStudents) : 0;
  const discountMo   = selectedPlan ? getAnnualDiscountMonths(selectedPlan) : 2;
  const annualBill   = monthlyBill * (12 - discountMo);
  const rootDomain   = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'yourdomain.com';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/super-admin/schools">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Schools
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Create New School</h1>
          <p className="text-sm text-muted-foreground">Set up a new educational institution on the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>Enter the basic details for the new school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input id="schoolName" value={formData.schoolName}
                  onChange={e => set('schoolName', e.target.value)}
                  placeholder="Enter school name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolCode">School Code *</Label>
                <Input id="schoolCode" value={formData.schoolCode}
                  onChange={e => set('schoolCode', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="SCHOOL_CODE" required />
                <p className="text-xs text-muted-foreground">Auto-generated from name</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enableSubdomain">Enable Custom Subdomain</Label>
                <p className="text-xs text-muted-foreground mt-1">Create a custom subdomain for this school</p>
              </div>
              <Switch id="enableSubdomain" checked={formData.enableSubdomain}
                onCheckedChange={v => set('enableSubdomain', v)} />
            </div>

            {formData.enableSubdomain && (
              <div className="space-y-2">
                <Label htmlFor="subdomain">Custom Subdomain *</Label>
                <div className="flex space-x-2">
                  <Input id="subdomain" value={formData.subdomain}
                    onChange={e => set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="school-name" required={formData.enableSubdomain} />
                  <Button type="button" variant="outline"
                    onClick={checkSubdomain}
                    disabled={!formData.subdomain || checkingSubdomain}>
                    {checkingSubdomain ? 'Checking…' : 'Check'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  https://{formData.subdomain || 'subdomain'}.{rootDomain}
                </p>
                {subdomainAvailable === true && (
                  <div className="flex items-center text-green-600 text-sm">
                    <Check className="h-4 w-4 mr-1" /> Subdomain available
                  </div>
                )}
                {subdomainAvailable === false && (
                  <div className="text-red-600 text-sm">Subdomain not available</div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input id="contactEmail" type="email" value={formData.contactEmail}
                  onChange={e => set('contactEmail', e.target.value)}
                  placeholder="admin@school.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input id="contactPhone" value={formData.contactPhone}
                  onChange={e => set('contactPhone', e.target.value)}
                  placeholder="+91 98765 43210" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the school…" rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2" />
              Subscription Plan
            </CardTitle>
            <CardDescription>Per-student pricing — bill scales with school size</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Billing toggle + student preview */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 border rounded-lg p-1">
                <button type="button"
                  onClick={() => setAnnual(false)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${!annual ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  Monthly
                </button>
                <button type="button"
                  onClick={() => setAnnual(true)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${annual ? 'bg-emerald-600 text-white' : 'text-muted-foreground'}`}>
                  Annual (2 months free)
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="estStudents" className="text-sm whitespace-nowrap">Estimated students:</Label>
                <Input id="estStudents" type="number" min={1} value={estimatedStudents}
                  onChange={e => setEstimatedStudents(parseInt(e.target.value) || 1)}
                  className="w-24 h-8 text-sm" />
              </div>
            </div>

            {/* Plan cards */}
            {availablePlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Loading plans… If none appear, seed default plans from the Plans page.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availablePlans.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    selected={formData.subscriptionPlan === plan.id}
                    annual={annual}
                    estimatedStudents={estimatedStudents}
                    onSelect={() => set('subscriptionPlan', plan.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="h-5 w-5 mr-2" />
              Authentication Configuration
            </CardTitle>
            <CardDescription>Set up the unified authentication system for this school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authMethod">Authentication Method</Label>
              <Select value={formData.authenticationMethod}
                onValueChange={v => set('authenticationMethod', v as 'password' | 'otp' | 'both')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="password">Password Only</SelectItem>
                  <SelectItem value="otp">OTP Only</SelectItem>
                  <SelectItem value="both">Password + Optional OTP</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How school admins will authenticate (students/parents always use OTP)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="enableOTP" checked={formData.enableOTPForAdmins}
                onCheckedChange={v => set('enableOTPForAdmins', v)} />
              <Label htmlFor="enableOTP" className="text-sm">Enable OTP for Admin Login</Label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Key className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Unified Authentication System</p>
                  <p className="text-blue-700 mt-1">
                    Role-based access control, multi-school support, and comprehensive audit logging.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedPlan && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>School Name:</span>
                  <span className="font-medium">{formData.schoolName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>School Code:</span>
                  <span className="font-medium">{formData.schoolCode || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subdomain:</span>
                  <span className="font-medium">
                    {formData.enableSubdomain
                      ? (formData.subdomain ? `${formData.subdomain}.${rootDomain}` : '—')
                      : 'Main platform access'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pricing:</span>
                  <span className="font-medium">₹{getPricePerStudent(selectedPlan).toFixed(0)}/student/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Contact Email:</span>
                  <span className="font-medium">{formData.contactEmail || '—'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Est. {annual ? 'Annual' : 'Monthly'} Bill ({estimatedStudents} students):</span>
                  <span>₹{fmtINR(annual ? annualBill : monthlyBill)}</span>
                </div>
                {annual && (
                  <div className="flex justify-between text-emerald-600 text-xs">
                    <span>Annual saving:</span>
                    <span>₹{fmtINR(monthlyBill * discountMo)} ({discountMo} months free)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/super-admin/schools">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              isLoading ||
              !formData.schoolName ||
              !formData.schoolCode ||
              (formData.enableSubdomain && !formData.subdomain) ||
              !formData.contactEmail
            }
          >
            {isLoading ? 'Creating…' : 'Create School & Launch Setup'}
          </Button>
        </div>
      </form>
    </div>
  );
}

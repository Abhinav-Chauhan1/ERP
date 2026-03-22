"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Edit, Trash2, Copy, Users, IndianRupee, Sprout } from "lucide-react";
import { toast } from "sonner";
import { type FeatureKey, PLAN_FEATURES } from "@/lib/config/plan-features";
import { seedDefaultPlans } from "@/lib/actions/seed-plans-action";

// ── Types ────────────────────────────────────────────────────────────────────

interface PlanFeatures {
  pricePerStudent:      number;
  minimumMonthly:       number;
  annualDiscountMonths: number;
  storageGB:            number;
  smsLimit:             number;
  whatsappLimit:        number;
  includedFeatures:     string[];
  support: {
    email:     boolean;
    phone:     boolean;
    priority:  boolean;
    dedicated: boolean;
  };
}

interface SubscriptionPlan {
  id:          string;
  name:        string;
  description: string | null;
  interval:    string;
  features:    Partial<PlanFeatures>; // DB JSON — all fields may be missing
  isActive:    boolean;
  createdAt:   string;
  _count?: { subscriptions: number };
}

interface FormData {
  name:        string;
  description: string;
  interval:    string;
  isActive:    boolean;
  features:    PlanFeatures;
}

const DEFAULT_FEATURES: PlanFeatures = {
  pricePerStudent:      400,
  minimumMonthly:       50000,
  annualDiscountMonths: 2,
  storageGB:            1,
  smsLimit:             500,
  whatsappLimit:        0,
  includedFeatures:     [],
  support: { email: true, phone: false, priority: false, dedicated: false },
};

const DEFAULT_FORM: FormData = {
  name:        '',
  description: '',
  interval:    'monthly',
  isActive:    true,
  features:    DEFAULT_FEATURES,
};

// ── Feature groups for checkboxes ────────────────────────────────────────────

const FEATURE_GROUPS: { label: string; keys: FeatureKey[] }[] = [
  {
    label: 'Starter features',
    keys: ['study_tools'],
  },
  {
    label: 'Growth features',
    keys: ['library', 'transport', 'admissions', 'bulk_messaging', 'whatsapp',
           'message_templates', 'payroll', 'budget', 'finance_analytics',
           'advanced_reports', 'id_cards', 'certificates'],
  },
  {
    label: 'Dominate features',
    keys: ['hostel', 'alumni', 'audit_logs', 'lms'],
  },
];

const FEATURE_LABELS: Record<FeatureKey, string> = {
  library:          'Library',
  transport:        'Transport',
  admissions:       'Admissions Portal',
  bulk_messaging:   'Bulk Messaging',
  whatsapp:         'WhatsApp Integration',
  message_templates:'Message Templates',
  payroll:          'Payroll',
  budget:           'Budget',
  finance_analytics:'Finance Analytics',
  advanced_reports: 'Advanced Reports',
  id_cards:         'ID Cards',
  certificates:     'Certificates',
  hostel:           'Hostel',
  alumni:           'Alumni',
  audit_logs:       'Audit Logs',
  lms:              'LMS / Courses',
  study_tools:      'Study Tools',
};

// ── Price preview ─────────────────────────────────────────────────────────────

function PricePreview({ features }: { features: PlanFeatures }) {
  const pps = features.pricePerStudent / 100; // paise → rupees
  const min = features.minimumMonthly / 100;
  const samples = [100, 300, 500, 1000];

  return (
    <div className="rounded-lg bg-muted/50 p-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground mb-2">Monthly bill preview</p>
      {samples.map(n => {
        const bill = Math.max(n * pps, min);
        return (
          <div key={n} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{n} students</span>
            <span className="font-medium">₹{bill.toLocaleString('en-IN')}/mo</span>
          </div>
        );
      })}
      <Separator className="my-1" />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Annual (×{12 - features.annualDiscountMonths} mo)</span>
        <span className="font-medium text-emerald-600">
          ₹{(Math.max(300 * pps, min) * (12 - features.annualDiscountMonths)).toLocaleString('en-IN')}/yr
          <span className="text-muted-foreground ml-1">(300 students)</span>
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function SubscriptionPlansManagement() {
  const [plans, setPlans]           = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<SubscriptionPlan | null>(null);
  const [form, setForm]             = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);
  const [seeding, setSeeding]       = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/super-admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans ?? []);
      } else {
        toast.error('Failed to fetch plans');
      }
    } catch {
      toast.error('Failed to fetch plans');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setDialogOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditing(plan);
    setForm({
      name:        plan.name,
      description: plan.description ?? '',
      interval:    plan.interval,
      isActive:    plan.isActive,
      features: {
        pricePerStudent:      plan.features?.pricePerStudent      ?? 400,
        minimumMonthly:       plan.features?.minimumMonthly       ?? 50000,
        annualDiscountMonths: plan.features?.annualDiscountMonths ?? 2,
        storageGB:            plan.features?.storageGB            ?? 1,
        smsLimit:             plan.features?.smsLimit             ?? 500,
        whatsappLimit:        plan.features?.whatsappLimit        ?? 0,
        includedFeatures:     plan.features?.includedFeatures     ?? [],
        support: {
          email:     plan.features?.support?.email     ?? true,
          phone:     plan.features?.support?.phone     ?? false,
          priority:  plan.features?.support?.priority  ?? false,
          dedicated: plan.features?.support?.dedicated ?? false,
        },
      },
    });
    setDialogOpen(true);
  };

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const setFeature = <K extends keyof PlanFeatures>(key: K, value: PlanFeatures[K]) => {
    setForm(prev => ({ ...prev, features: { ...prev.features, [key]: value } }));
  };

  const toggleIncludedFeature = (key: FeatureKey, checked: boolean) => {
    setForm(prev => {
      const current = prev.features.includedFeatures;
      const next = checked ? [...current, key] : current.filter(f => f !== key);
      return { ...prev, features: { ...prev.features, includedFeatures: next } };
    });
  };

  const applyPreset = (preset: 'STARTER' | 'GROWTH' | 'DOMINATE') => {
    const presets: Record<string, Partial<PlanFeatures>> = {
      STARTER:  { pricePerStudent: 400,  minimumMonthly: 50000,  storageGB: 1,  smsLimit: 500,  whatsappLimit: 0,    includedFeatures: [] },
      GROWTH:   { pricePerStudent: 600,  minimumMonthly: 100000, storageGB: 5,  smsLimit: 2000, whatsappLimit: 1000, includedFeatures: [...PLAN_FEATURES.GROWTH] },
      DOMINATE: { pricePerStudent: 900,  minimumMonthly: 250000, storageGB: 20, smsLimit: -1,   whatsappLimit: 5000, includedFeatures: [...PLAN_FEATURES.DOMINATE] },
    };
    setForm(prev => ({ ...prev, features: { ...prev.features, ...presets[preset] } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editing ? `/api/super-admin/plans/${editing.id}` : '/api/super-admin/plans';
      const method = editing ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editing ? 'Plan updated' : 'Plan created');
        setDialogOpen(false);
        fetchPlans();
      } else {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to save plan');
      }
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleSeedPlans = async () => {
    if (!confirm('Upsert STARTER, GROWTH, and DOMINATE plans with default pricing? Existing plans will be updated.')) return;
    setSeeding(true);
    try {
      const result = await seedDefaultPlans();
      if (result.success) {
        toast.success(result.upserted.join(', '));
        fetchPlans();
      }
    } catch {
      toast.error('Failed to seed plans');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string) => {    if (!confirm('Delete this plan? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/super-admin/plans/${id}`, { method: 'DELETE' });
      if (res.ok) { toast.success('Plan deleted'); fetchPlans(); }
      else { const err = await res.json(); toast.error(err.error ?? 'Failed to delete'); }
    } catch { toast.error('Failed to delete plan'); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/super-admin/plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (res.ok) { toast.success(`Plan ${isActive ? 'activated' : 'deactivated'}`); fetchPlans(); }
      else toast.error('Failed to update status');
    } catch { toast.error('Failed to update status'); }
  };

  const fmt = (paise: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
      .format(paise / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground">Per-student pricing with feature differentiation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedPlans} disabled={seeding}>
            <Sprout className="h-4 w-4 mr-2" />
            {seeding ? 'Seeding…' : 'Seed default plans'}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Plans ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading plans…</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Features</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schools</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium">{plan.name}</div>
                      {plan.description && (
                        <div className="text-xs text-muted-foreground">{plan.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        {(plan.features?.pricePerStudent ?? 0) > 0 ? (
                          <>
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-3 w-3" />
                              <span>{((plan.features?.pricePerStudent ?? 0) / 100).toFixed(0)}/student/mo</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Min {fmt(plan.features?.minimumMonthly ?? 0)}/mo
                            </div>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                            Needs seeding
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-0.5">
                        <div>{plan.features?.storageGB ?? '?'}GB storage</div>
                        <div>SMS: {plan.features?.smsLimit === -1 ? '∞' : (plan.features?.smsLimit ?? '?')}</div>
                        <div>WA: {plan.features?.whatsappLimit === -1 ? '∞' : (plan.features?.whatsappLimit ?? '?')}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {(plan.features?.includedFeatures?.length ?? 0) === 0
                          ? 'Core only'
                          : `${plan.features?.includedFeatures?.length ?? 0} features`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={plan.isActive}
                          onCheckedChange={v => handleToggleActive(plan.id, v)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3.5 w-3.5" />
                        {plan._count?.subscriptions ?? 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(plan)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(plan.id)}>
                            <Copy className="h-4 w-4 mr-2" /> Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(plan.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update plan pricing and features' : 'Create a new per-student pricing plan'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Preset buttons */}
            <div className="flex gap-2">
              <span className="text-xs text-muted-foreground self-center mr-1">Presets:</span>
              {(['STARTER', 'GROWTH', 'DOMINATE'] as const).map(p => (
                <Button key={p} type="button" variant="outline" size="sm"
                  onClick={() => applyPreset(p)}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>

            {/* Basic info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Basic Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input id="name" value={form.name}
                      onChange={e => setField('name', e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="interval">Billing Interval</Label>
                    <select id="interval" value={form.interval}
                      onChange={e => setField('interval', e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={form.description} rows={2}
                    onChange={e => setField('description', e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={form.isActive}
                    onCheckedChange={v => setField('isActive', v)} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader><CardTitle className="text-base">Pricing</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pps">Price per student (paise) *</Label>
                    <Input id="pps" type="number" min={1}
                      value={form.features.pricePerStudent}
                      onChange={e => setFeature('pricePerStudent', parseInt(e.target.value) || 0)}
                      required />
                    <p className="text-xs text-muted-foreground">
                      = ₹{(form.features.pricePerStudent / 100).toFixed(2)}/student/mo
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="minm">Minimum monthly (paise) *</Label>
                    <Input id="minm" type="number" min={1}
                      value={form.features.minimumMonthly}
                      onChange={e => setFeature('minimumMonthly', parseInt(e.target.value) || 0)}
                      required />
                    <p className="text-xs text-muted-foreground">
                      = ₹{(form.features.minimumMonthly / 100).toFixed(0)} minimum/mo
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adm">Annual discount months (free months)</Label>
                  <Input id="adm" type="number" min={0} max={12}
                    value={form.features.annualDiscountMonths}
                    onChange={e => setFeature('annualDiscountMonths', parseInt(e.target.value) || 0)} />
                  <p className="text-xs text-muted-foreground">
                    Annual = monthly × {12 - form.features.annualDiscountMonths} months
                  </p>
                </div>
                <PricePreview features={form.features} />
              </CardContent>
            </Card>

            {/* Limits */}
            <Card>
              <CardHeader><CardTitle className="text-base">Usage Limits</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="storage">Storage (GB)</Label>
                  <Input id="storage" type="number" min={1}
                    value={form.features.storageGB}
                    onChange={e => setFeature('storageGB', parseInt(e.target.value) || 1)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sms">SMS/month (-1 = ∞)</Label>
                  <Input id="sms" type="number" min={-1}
                    value={form.features.smsLimit}
                    onChange={e => setFeature('smsLimit', parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wa">WhatsApp/month (-1 = ∞)</Label>
                  <Input id="wa" type="number" min={-1}
                    value={form.features.whatsappLimit}
                    onChange={e => setFeature('whatsappLimit', parseInt(e.target.value) || 0)} />
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader><CardTitle className="text-base">Included Features</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Core features (Dashboard, Users, Academic, Assessment, Attendance, Finance basics,
                  Communication basics, Calendar, Events, Documents overview, Settings) are always included.
                </p>
                {FEATURE_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.keys.map(key => (
                        <div key={key} className="flex items-center gap-2">
                          <Checkbox
                            id={key}
                            checked={form.features.includedFeatures.includes(key)}
                            onCheckedChange={v => toggleIncludedFeature(key, !!v)}
                          />
                          <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                            {FEATURE_LABELS[key]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Support */}
            <Card>
              <CardHeader><CardTitle className="text-base">Support</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                {(['email', 'phone', 'priority', 'dedicated'] as const).map(key => (
                  <div key={key} className="flex items-center justify-between p-2 border rounded-lg">
                    <Label className="capitalize">{key} support</Label>
                    <Switch
                      checked={form.features.support[key]}
                      onCheckedChange={v =>
                        setFeature('support', { ...form.features.support, [key]: v })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

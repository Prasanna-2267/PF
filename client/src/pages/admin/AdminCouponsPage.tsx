import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Input, Select } from '../../components/ui';
import { adminContentApi, type SubjectNode } from '../../features/admin/content.api';
import { commerceApi, type NewCoupon } from '../../features/commerce/commerce.api';
import { errorMessage } from '../../features/auth/auth.api';

type AppliesTo = 'all' | 'packages' | 'subjects';

export function AdminCouponsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [appliesTo, setAppliesTo] = useState<AppliesTo>('all');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [pkgSel, setPkgSel] = useState<Record<string, string>>({});
  const [subSel, setSubSel] = useState<Record<string, string>>({});
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');

  const coupons = useQuery({ queryKey: ['admin', 'coupons'], queryFn: commerceApi.coupons });
  const packages = useQuery({ queryKey: ['admin', 'packages'], queryFn: commerceApi.adminPackages, enabled: appliesTo === 'packages' });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminContentApi.listCategories, enabled: appliesTo === 'subjects' });
  const stages = useQuery({ queryKey: ['admin', 'stages', catId], queryFn: () => adminContentApi.listStages(catId), enabled: appliesTo === 'subjects' && !!catId });
  const subjects = useQuery({ queryKey: ['admin', 'subjtree', stageId], queryFn: () => adminContentApi.getSubjectTree(stageId), enabled: appliesTo === 'subjects' && !!stageId });

  async function run(fn: () => Promise<unknown>): Promise<void> {
    try {
      setError('');
      await fn();
      await qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const toggle = (set: (u: (s: Record<string, string>) => Record<string, string>) => void) => (id: string, label: string) =>
    set((s) => {
      const n = { ...s };
      if (n[id]) delete n[id];
      else n[id] = label;
      return n;
    });
  const togglePkg = toggle(setPkgSel);
  const toggleSub = toggle(setSubSel);

  async function create() {
    const value = Number(discountValue);
    if (!code.trim() || Number.isNaN(value) || value < 0) {
      setError('Enter a code and a valid discount.');
      return;
    }
    const payload: NewCoupon = { code: code.trim(), discountType, discountValue: value, appliesTo };
    if (appliesTo === 'packages') payload.packageIds = Object.keys(pkgSel);
    if (appliesTo === 'subjects') payload.subjectIds = Object.keys(subSel);
    if (maxRedemptions) payload.maxRedemptions = Number(maxRedemptions);
    if (expiresAt) payload.expiresAt = new Date(`${expiresAt}T23:59:59`).toISOString();

    await run(() => commerceApi.createCoupon(payload));
    setCode('');
    setDiscountValue('');
    setMaxRedemptions('');
    setExpiresAt('');
    setPkgSel({});
    setSubSel({});
  }

  const subjectOptions = subjects.data ? flatten(subjects.data) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Coupons</h1>
      <Alert>{error}</Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-sm font-medium">Existing</h2>
          <div className="mt-3 space-y-2">
            {coupons.data?.length === 0 && <p className="text-sm text-muted">No coupons yet.</p>}
            {coupons.data?.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium">
                    <span className="font-mono">{c.code}</span>
                    {!c.isActive && <Badge tone="danger">off</Badge>}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`} ·{' '}
                    {c.appliesTo === 'all' ? 'all items' : c.appliesTo === 'packages' ? `${c.packageIds.length} pkgs` : `${c.subjectIds.length} subj`} ·{' '}
                    {c.redemptions}
                    {c.maxRedemptions != null ? `/${c.maxRedemptions}` : ''} used
                    {c.expiresAt ? ` · till ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => void run(() => commerceApi.updateCoupon(c.id, { isActive: !c.isActive }))}>
                  {c.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="danger" onClick={() => { if (window.confirm(`Delete ${c.code}?`)) void run(() => commerceApi.deleteCoupon(c.id)); }}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-display text-sm font-medium">New coupon</h2>
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SAVE20" />
          <div className="flex gap-2">
            <Select label="Discount" value={discountType} onChange={(e) => setDiscountType(e.target.value as 'percent' | 'flat')} className="w-32">
              <option value="percent">Percent %</option>
              <option value="flat">Flat ₹</option>
            </Select>
            <Input label={discountType === 'percent' ? 'Value (%)' : 'Value (₹)'} inputMode="numeric" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-28" />
          </div>

          <Select label="Applies to" value={appliesTo} onChange={(e) => setAppliesTo(e.target.value as AppliesTo)}>
            <option value="all">All items</option>
            <option value="packages">Specific packages</option>
            <option value="subjects">Specific subjects</option>
          </Select>

          {appliesTo === 'packages' && (
            <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-line p-2">
              {packages.data?.length === 0 && <p className="text-xs text-muted">No packages.</p>}
              {packages.data?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!pkgSel[p.id]} onChange={() => togglePkg(p.id, p.title)} />
                  <span className="truncate">{p.title}</span>
                </label>
              ))}
            </div>
          )}

          {appliesTo === 'subjects' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Select value={catId} onChange={(e) => { setCatId(e.target.value); setStageId(''); }} className="w-32">
                  <option value="">Exam</option>
                  {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
                <Select value={stageId} onChange={(e) => setStageId(e.target.value)} disabled={!catId} className="w-32">
                  <option value="">Stage</option>
                  {stages.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Select>
              </div>
              {stageId && (
                <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-line p-2">
                  {subjectOptions.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={!!subSel[o.id]} onChange={() => toggleSub(o.id, o.label)} />
                      <span className="truncate">{o.label}</span>
                    </label>
                  ))}
                </div>
              )}
              {Object.keys(subSel).length > 0 && <p className="text-xs text-muted">{Object.keys(subSel).length} subject(s) selected</p>}
            </div>
          )}

          <div className="flex gap-2">
            <Input label="Max uses (optional)" inputMode="numeric" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} className="w-32" />
            <Input label="Expires (optional)" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>

          <Button onClick={() => void create()}>Create coupon</Button>
        </Card>
      </div>
    </div>
  );
}

function flatten(nodes: SubjectNode[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    out.push(...flatten(n.children, depth + 1));
  }
  return out;
}

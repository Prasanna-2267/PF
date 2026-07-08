import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  MultiSelect,
  RadioGroup,
  SegmentedControl,
  Skeleton,
  useToast,
  PlusIcon,
  TagIcon,
  TrashIcon,
  type BadgeTone,
  type MultiOption,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { useDisclosure } from '../../hooks';
import {
  CatalogPicker,
  flattenSubjects,
  useSubjectTree,
  type CatalogSelection,
} from '../../features/catalog';
import { commerceApi, type Coupon, type NewCoupon } from '../../features/commerce/commerce.api';
import { errorMessage } from '../../features/auth/auth.api';
import { ConfirmDialog, useAdminAction } from './admin-shared';

type AppliesTo = 'all' | 'packages' | 'subjects';

const COUPONS_KEY: unknown[][] = [['admin', 'coupons']];

function couponStatus(c: Coupon): { tone: BadgeTone; label: string } {
  if (!c.isActive) return { tone: 'neutral', label: 'Disabled' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now())
    return { tone: 'danger', label: 'Expired' };
  if (c.maxRedemptions != null && c.redemptions >= c.maxRedemptions)
    return { tone: 'warn', label: 'Limit reached' };
  return { tone: 'success', label: 'Active' };
}

function discountLabel(c: Coupon): string {
  return c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`;
}

function scopeLabel(c: Coupon): string {
  if (c.appliesTo === 'all') return 'All items';
  if (c.appliesTo === 'packages')
    return `${c.packageIds.length} package${c.packageIds.length === 1 ? '' : 's'}`;
  return `${c.subjectIds.length} subject${c.subjectIds.length === 1 ? '' : 's'}`;
}

export function AdminCouponsPage() {
  const coupons = useQuery({ queryKey: ['admin', 'coupons'], queryFn: commerceApi.coupons });
  const { run } = useAdminAction();
  const create = useDisclosure();
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Coupons' }]}
        title="Coupons"
        description="Percent or flat discounts, scoped to everything, specific packages or subjects."
        actions={
          <Button leftIcon={<PlusIcon size={16} />} onClick={create.open}>
            New coupon
          </Button>
        }
      />

      {coupons.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton shape="block" className="h-36" />
          <Skeleton shape="block" className="h-36" />
          <Skeleton shape="block" className="h-36" />
        </div>
      ) : coupons.isError ? (
        <ErrorState message={errorMessage(coupons.error)} onRetry={() => void coupons.refetch()} />
      ) : coupons.data && coupons.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.data.map((c) => {
            const status = couponStatus(c);
            return (
              <Card key={c.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-base font-bold text-fg">{c.code}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {discountLabel(c)} · {scopeLabel(c)}
                    </p>
                  </div>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
                <p className="tabular text-xs text-muted">
                  {c.redemptions}
                  {c.maxRedemptions != null ? `/${c.maxRedemptions}` : ''} used
                  {c.expiresAt
                    ? ` · expires ${new Date(c.expiresAt).toLocaleDateString('en-IN', {
                        dateStyle: 'medium',
                      })}`
                    : ''}
                </p>
                <div className="mt-auto flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      run(() => commerceApi.updateCoupon(c.id, { isActive: !c.isActive }), {
                        invalidate: COUPONS_KEY,
                        success: c.isActive ? 'Coupon disabled' : 'Coupon enabled',
                      })
                    }
                  >
                    {c.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    leftIcon={<TrashIcon size={16} />}
                    onClick={() => setDeleteTarget(c)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<TagIcon size={22} />}
          title="No coupons yet"
          description="Create a coupon to offer a percent or flat discount at checkout."
          action={
            <Button size="sm" leftIcon={<PlusIcon size={16} />} onClick={create.open}>
              New coupon
            </Button>
          }
        />
      )}

      {create.isOpen ? <CouponForm open onClose={create.close} /> : null}
      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title={`Delete ${deleteTarget.code}?`}
          description="The coupon can no longer be applied at checkout. Past orders are unaffected."
          confirmLabel="Delete coupon"
          onConfirm={() => commerceApi.deleteCoupon(deleteTarget.id)}
          invalidate={COUPONS_KEY}
          success="Coupon deleted"
        />
      ) : null}
    </>
  );
}

function CouponForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [value, setValue] = useState('');
  const [appliesTo, setAppliesTo] = useState<AppliesTo>('all');
  const [pkgIds, setPkgIds] = useState<string[]>([]);
  const [subSel, setSubSel] = useState<Record<string, string>>({});
  const [sel, setSel] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const packages = useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: commerceApi.adminPackages,
    enabled: appliesTo === 'packages',
  });
  const subjectTree = useSubjectTree(appliesTo === 'subjects' ? sel.stageId : null);

  const flatSubjects = subjectTree.data ? flattenSubjects(subjectTree.data) : [];
  const subjectOptions: MultiOption[] = flatSubjects.map((s) => ({
    value: s.id,
    label: `${'  '.repeat(s.depth)}${s.depth > 0 ? '↳ ' : ''}${s.name}`,
  }));
  const currentSubjectIds = new Set(flatSubjects.map((s) => s.id));
  const subValues = Object.keys(subSel).filter((id) => currentSubjectIds.has(id));

  const packageOptions: MultiOption[] =
    packages.data?.map((p) => ({ value: p.id, label: p.title })) ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      const payload: NewCoupon = {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(value),
        appliesTo,
      };
      if (appliesTo === 'packages') payload.packageIds = pkgIds;
      if (appliesTo === 'subjects') payload.subjectIds = Object.keys(subSel);
      if (maxUses) payload.maxRedemptions = Number(maxUses);
      if (expiresAt) payload.expiresAt = new Date(`${expiresAt}T23:59:59`).toISOString();
      return commerceApi.createCoupon(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      toast.success('Coupon created');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function onSubjectsChange(vals: string[]) {
    setSubSel((prev) => {
      const next = { ...prev };
      currentSubjectIds.forEach((id) => delete next[id]);
      vals.forEach((id) => {
        const s = flatSubjects.find((x) => x.id === id);
        next[id] = s ? s.name : prev[id] ?? '';
      });
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(value);
    if (!code.trim()) {
      setError('Enter a coupon code.');
      return;
    }
    if (!value.trim() || Number.isNaN(num) || num <= 0) {
      setError('Enter a discount value greater than zero.');
      return;
    }
    if (discountType === 'percent' && num > 100) {
      setError('A percent discount can’t exceed 100.');
      return;
    }
    if (appliesTo === 'packages' && pkgIds.length === 0) {
      setError('Pick at least one package, or change the scope to All items.');
      return;
    }
    if (appliesTo === 'subjects' && Object.keys(subSel).length === 0) {
      setError('Pick at least one subject, or change the scope to All items.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New coupon"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            Create coupon
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <Input
          label="Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="SAVE20"
          className="font-mono uppercase"
        />

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg">Discount</span>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl
              aria-label="Discount type"
              value={discountType}
              onChange={(v) => setDiscountType(v as 'percent' | 'flat')}
              options={[
                { value: 'percent', label: 'Percent %' },
                { value: 'flat', label: 'Flat ₹' },
              ]}
            />
            <Input
              aria-label={discountType === 'percent' ? 'Percent off' : 'Rupees off'}
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === 'percent' ? '20' : '100'}
              wrapperClassName="w-28"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg">Applies to</span>
          <RadioGroup
            aria-label="Coupon scope"
            columns={3}
            value={appliesTo}
            onChange={(v) => setAppliesTo(v as AppliesTo)}
            options={[
              { value: 'all', label: 'All items' },
              { value: 'packages', label: 'Packages', description: 'Chosen packages only' },
              { value: 'subjects', label: 'Subjects', description: 'Lessons in chosen subjects' },
            ]}
          />
        </div>

        {appliesTo === 'packages' ? (
          packages.isLoading ? (
            <Skeleton className="h-11" />
          ) : packageOptions.length === 0 ? (
            <p className="text-sm text-muted">No packages exist yet.</p>
          ) : (
            <MultiSelect
              label="Packages"
              values={pkgIds}
              onChange={setPkgIds}
              options={packageOptions}
              placeholder="Select packages…"
            />
          )
        ) : null}

        {appliesTo === 'subjects' ? (
          <div className="space-y-2">
            <CatalogPicker value={sel} onChange={setSel} includeSubject={false} />
            {sel.stageId ? (
              subjectTree.isLoading ? (
                <Skeleton className="h-11" />
              ) : subjectOptions.length === 0 ? (
                <p className="text-sm text-muted">This stage has no subjects yet.</p>
              ) : (
                <MultiSelect
                  label="Subjects in this stage"
                  values={subValues}
                  onChange={onSubjectsChange}
                  options={subjectOptions}
                  placeholder="Select subjects…"
                />
              )
            ) : (
              <p className="text-sm text-muted">Pick a stage to list its subjects.</p>
            )}
            {Object.keys(subSel).length > 0 ? (
              <p className="text-xs text-muted">
                {Object.keys(subSel).length} subject
                {Object.keys(subSel).length === 1 ? '' : 's'} selected across all stages.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Max uses (optional)"
            inputMode="numeric"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited"
          />
          <Input
            label="Expires (optional)"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}

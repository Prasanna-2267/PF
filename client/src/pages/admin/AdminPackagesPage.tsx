import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  MultiSelect,
  Skeleton,
  useToast,
  CloseIcon,
  EditIcon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
  type MultiOption,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { useDisclosure } from '../../hooks';
import { CatalogPicker, type CatalogSelection } from '../../features/catalog';
import { commerceApi, type Package } from '../../features/commerce/commerce.api';
import { adminLessonsApi } from '../../features/admin/admin-lessons.api';
import { errorMessage } from '../../features/auth/auth.api';
import { ConfirmDialog, PublishBadge, useAdminAction } from './admin-shared';

const PACKAGES_KEY: unknown[][] = [['admin', 'packages']];

export function AdminPackagesPage() {
  const packages = useQuery({ queryKey: ['admin', 'packages'], queryFn: commerceApi.adminPackages });
  const { run } = useAdminAction();
  const create = useDisclosure();
  const [editTarget, setEditTarget] = useState<Package | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Packages' }]}
        title="Packages"
        description="Bundle lessons from across the catalogue and sell them together."
        actions={
          <Button leftIcon={<PlusIcon size={16} />} onClick={create.open}>
            New package
          </Button>
        }
      />

      {packages.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton shape="block" className="h-40" />
          <Skeleton shape="block" className="h-40" />
          <Skeleton shape="block" className="h-40" />
        </div>
      ) : packages.isError ? (
        <ErrorState message={errorMessage(packages.error)} onRetry={() => void packages.refetch()} />
      ) : packages.data && packages.data.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {packages.data.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-fg">{pkg.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {pkg.lessonCount} lesson{pkg.lessonCount === 1 ? '' : 's'}
                  </p>
                </div>
                <PublishBadge active={pkg.isActive} />
              </div>
              <p className="tabular text-xl font-bold text-fg">₹{pkg.price}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    run(() => commerceApi.updatePackage(pkg.id, { isActive: !pkg.isActive }), {
                      invalidate: PACKAGES_KEY,
                      success: pkg.isActive ? 'Package hidden' : 'Package published',
                    })
                  }
                >
                  {pkg.isActive ? 'Unpublish' : 'Publish'}
                </Button>
                <Button size="sm" variant="ghost" leftIcon={<EditIcon size={16} />} onClick={() => setEditTarget(pkg)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  leftIcon={<TrashIcon size={16} />}
                  onClick={() => setDeleteTarget(pkg)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PackageIcon size={22} />}
          title="No packages yet"
          description="Create a package to bundle several lessons at a single price."
          action={
            <Button size="sm" leftIcon={<PlusIcon size={16} />} onClick={create.open}>
              New package
            </Button>
          }
        />
      )}

      {create.isOpen ? <PackageForm open onClose={create.close} /> : null}
      {editTarget ? (
        <PackageForm open onClose={() => setEditTarget(null)} pkg={editTarget} />
      ) : null}
      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title={`Delete “${deleteTarget.title}”?`}
          description="The package is removed from the store. Students who already bought it keep the lessons they own."
          confirmLabel="Delete package"
          onConfirm={() => commerceApi.deletePackage(deleteTarget.id)}
          invalidate={PACKAGES_KEY}
          success="Package deleted"
        />
      ) : null}
    </>
  );
}

function PackageForm({
  open,
  onClose,
  pkg,
}: {
  open: boolean;
  onClose: () => void;
  pkg?: Package;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [title, setTitle] = useState(pkg?.title ?? '');
  const [price, setPrice] = useState(pkg ? String(pkg.price) : '');
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries((pkg?.lessonIds ?? []).map((id) => [id, ''])),
  );
  const [sel, setSel] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });
  const [error, setError] = useState('');

  const lessons = useQuery({
    queryKey: ['admin', 'lessons', sel.subjectId],
    queryFn: () => adminLessonsApi.list(sel.subjectId as string),
    enabled: Boolean(sel.subjectId),
  });

  const currentIds = lessons.data?.map((l) => l.id) ?? [];
  const currentIdSet = new Set(currentIds);
  const values = Object.keys(selected).filter((id) => currentIdSet.has(id));
  const options: MultiOption[] =
    lessons.data?.map((l) => ({
      value: l.id,
      label: l.title,
      description: l.isFree ? 'Free' : `₹${l.price}`,
    })) ?? [];

  const mutation = useMutation({
    mutationFn: () => {
      const lessonIds = Object.keys(selected);
      const priceNum = Number(price);
      return pkg
        ? commerceApi.updatePackage(pkg.id, { title: title.trim(), price: priceNum, lessonIds })
        : commerceApi.createPackage({ title: title.trim(), price: priceNum, lessonIds });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success(pkg ? 'Package updated' : 'Package created');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function onLessonsChange(vals: string[]) {
    setSelected((prev) => {
      const next = { ...prev };
      currentIds.forEach((id) => delete next[id]);
      vals.forEach((id) => {
        const l = lessons.data?.find((x) => x.id === id);
        next[id] = l ? l.title : prev[id] ?? '';
      });
      return next;
    });
  }

  function removeLesson(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    if (!title.trim()) {
      setError('Enter a package title.');
      return;
    }
    if (!price.trim() || Number.isNaN(priceNum) || priceNum < 0) {
      setError('Enter a valid price in rupees.');
      return;
    }
    if (Object.keys(selected).length === 0) {
      setError('Add at least one lesson.');
      return;
    }
    mutation.mutate();
  }

  const selectedEntries = Object.entries(selected);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={pkg ? 'Edit package' : 'New package'}
      description="Set a price, then browse the hierarchy and add lessons."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {pkg ? 'Save changes' : `Create package (${selectedEntries.length})`}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          <Input
            label="Price (₹)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 999"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-fg">Add lessons</p>
          <CatalogPicker value={sel} onChange={setSel} />
          {sel.subjectId ? (
            lessons.isLoading ? (
              <Skeleton className="h-11" />
            ) : options.length === 0 ? (
              <p className="text-sm text-muted">This subject has no lessons yet.</p>
            ) : (
              <MultiSelect
                label="Lessons in this subject"
                values={values}
                onChange={onLessonsChange}
                options={options}
                placeholder="Select lessons to add…"
              />
            )
          ) : (
            <p className="text-sm text-muted">Pick a subject to list its lessons.</p>
          )}
        </div>

        <div className="rounded-field border border-line bg-sunken/40 p-3">
          <p className="text-sm font-semibold text-fg">Selected lessons ({selectedEntries.length})</p>
          {selectedEntries.length === 0 ? (
            <p className="mt-1 text-sm text-muted">None yet — add lessons from any subject above.</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedEntries.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeLesson(id)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-2.5 pr-1.5 text-xs font-medium text-primary-soft-fg"
                >
                  <span className="max-w-[12rem] truncate">{label || `#${id.slice(-6)}`}</span>
                  <CloseIcon size={12} />
                </button>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

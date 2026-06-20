import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Input, Select } from '../../components/ui';
import { adminContentApi, type SubjectNode } from '../../features/admin/content.api';
import { adminLessonsApi } from '../../features/admin/admin-lessons.api';
import { commerceApi } from '../../features/commerce/commerce.api';
import { errorMessage } from '../../features/auth/auth.api';

export function AdminPackagesPage() {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const packages = useQuery({ queryKey: ['admin', 'packages'], queryFn: commerceApi.adminPackages });
  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminContentApi.listCategories });
  const stages = useQuery({ queryKey: ['admin', 'stages', catId], queryFn: () => adminContentApi.listStages(catId), enabled: !!catId });
  const subjects = useQuery({ queryKey: ['admin', 'subjtree', stageId], queryFn: () => adminContentApi.getSubjectTree(stageId), enabled: !!stageId });
  const lessons = useQuery({ queryKey: ['admin', 'lessons', subjectId], queryFn: () => adminLessonsApi.list(subjectId), enabled: !!subjectId });

  async function run(fn: () => Promise<unknown>): Promise<void> {
    try {
      setError('');
      await fn();
      await qc.invalidateQueries({ queryKey: ['admin', 'packages'] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function toggleLesson(id: string, t: string) {
    setSelected((s) => {
      const next = { ...s };
      if (next[id]) delete next[id];
      else next[id] = t;
      return next;
    });
  }

  async function createPackage() {
    const ids = Object.keys(selected);
    const p = Number(price);
    if (!title.trim() || ids.length === 0 || Number.isNaN(p) || p < 0) {
      setError('Add a title, a price, and at least one lesson.');
      return;
    }
    await run(() => commerceApi.createPackage({ title: title.trim(), price: p, lessonIds: ids }));
    setTitle('');
    setPrice('');
    setSelected({});
  }

  const subjectOptions = subjects.data ? flatten(subjects.data) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Packages</h1>
      <Alert>{error}</Alert>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="font-display text-sm font-medium">Existing</h2>
          <div className="mt-3 space-y-2">
            {packages.data?.length === 0 && <p className="text-sm text-muted">No packages yet.</p>}
            {packages.data?.map((pkg) => (
              <div key={pkg.id} className="flex items-center gap-2 rounded-lg border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pkg.title}
                    {!pkg.isActive && <span className="ml-2 text-xs text-danger">hidden</span>}
                  </p>
                  <p className="font-mono text-xs text-muted">
                    ₹{pkg.price} · {pkg.lessonCount} lessons
                  </p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => void run(() => commerceApi.updatePackage(pkg.id, { isActive: !pkg.isActive }))}>
                  {pkg.isActive ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete "${pkg.title}"?`)) void run(() => commerceApi.deletePackage(pkg.id));
                  }}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 p-4">
          <h2 className="font-display text-sm font-medium">New package</h2>
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Price (₹)" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted">Add lessons</span>
            <div className="flex flex-wrap gap-2">
              <Select value={catId} onChange={(e) => { setCatId(e.target.value); setStageId(''); setSubjectId(''); }} className="w-32">
                <option value="">Exam</option>
                {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
              <Select value={stageId} onChange={(e) => { setStageId(e.target.value); setSubjectId(''); }} disabled={!catId} className="w-32">
                <option value="">Stage</option>
                {stages.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!stageId} className="w-40">
                <option value="">Subject</option>
                {subjectOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </Select>
            </div>
            {subjectId && (
              <div className="mt-2 max-h-40 space-y-1 overflow-auto rounded-lg border border-line p-2">
                {lessons.data?.length === 0 && <p className="text-xs text-muted">No lessons.</p>}
                {lessons.data?.map((l) => (
                  <label key={l.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!selected[l.id]} onChange={() => toggleLesson(l.id, l.title)} />
                    <span className="truncate">{l.title}</span>
                    {l.isFree && <Badge tone="accent">free</Badge>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {Object.keys(selected).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(selected).map(([id, t]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleLesson(id, t)}
                  className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
                >
                  {t} ✕
                </button>
              ))}
            </div>
          )}

          <Button onClick={() => void createPackage()}>Create package ({Object.keys(selected).length})</Button>
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

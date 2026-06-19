import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button } from '../../components/ui';
import {
  adminContentApi,
  slugify,
  type Category,
  type Stage,
  type SubjectNode,
} from '../../features/admin/content.api';
import { errorMessage } from '../../features/auth/auth.api';
import { LessonsPanel } from './LessonsPanel';

export function AdminContentPage() {
  const qc = useQueryClient();
  const [catId, setCatId] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminContentApi.listCategories });
  const stages = useQuery({
    queryKey: ['admin', 'stages', catId],
    queryFn: () => adminContentApi.listStages(catId as string),
    enabled: !!catId,
  });
  const subjects = useQuery({
    queryKey: ['admin', 'subjects', stageId],
    queryFn: () => adminContentApi.getSubjectTree(stageId as string),
    enabled: !!stageId,
  });

  async function run(fn: () => Promise<unknown>, keys: unknown[][]): Promise<boolean> {
    try {
      setError('');
      await fn();
      for (const key of keys) await qc.invalidateQueries({ queryKey: key });
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  }

  const catKey = [['admin', 'categories']];
  const stageKey = [['admin', 'stages', catId]];
  const subjKey = [['admin', 'subjects', stageId]];

  function addCategory() {
    const name = window.prompt('Exam category name (e.g. CA, NEET, JEE):')?.trim();
    if (!name) return;
    const slug = window.prompt('URL slug:', slugify(name))?.trim();
    if (!slug) return;
    void run(() => adminContentApi.createCategory({ name, slug }), catKey);
  }
  function renameCategory(c: Category) {
    const name = window.prompt('Rename category:', c.name)?.trim();
    if (name && name !== c.name) void run(() => adminContentApi.updateCategory(c._id, { name }), catKey);
  }
  function delCategory(c: Category) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    void run(() => adminContentApi.deleteCategory(c._id), catKey).then((ok) => {
      if (ok && catId === c._id) {
        setCatId(null);
        setStageId(null);
        setSubjectId(null);
      }
    });
  }

  function addStage() {
    if (!catId) return;
    const name = window.prompt('Stage name (e.g. Foundation, Inter, Final):')?.trim();
    if (name) void run(() => adminContentApi.createStage({ name, examCategoryId: catId }), stageKey);
  }
  function renameStage(s: Stage) {
    const name = window.prompt('Rename stage:', s.name)?.trim();
    if (name && name !== s.name) void run(() => adminContentApi.updateStage(s._id, { name }), stageKey);
  }
  function delStage(s: Stage) {
    if (!window.confirm(`Delete stage "${s.name}"?`)) return;
    void run(() => adminContentApi.deleteStage(s._id), stageKey).then((ok) => {
      if (ok && stageId === s._id) {
        setStageId(null);
        setSubjectId(null);
      }
    });
  }

  function addSubject(parentSubjectId: string | null) {
    if (!stageId) return;
    const name = window.prompt(parentSubjectId ? 'Sub-subject name:' : 'Subject name:')?.trim();
    if (name) void run(() => adminContentApi.createSubject({ name, stageId, parentSubjectId }), subjKey);
  }
  function renameSubject(n: SubjectNode) {
    const name = window.prompt('Rename subject:', n.name)?.trim();
    if (name && name !== n.name) void run(() => adminContentApi.updateSubject(n.id, { name }), subjKey);
  }
  function delSubject(n: SubjectNode) {
    if (!window.confirm(`Delete "${n.name}"? (must have no sub-subjects)`)) return;
    void run(() => adminContentApi.deleteSubject(n.id), subjKey).then((ok) => {
      if (ok && subjectId === n.id) setSubjectId(null);
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl font-semibold tracking-tight">Content</h1>
      <Alert>{error}</Alert>

      <div className="flex flex-wrap gap-4">
        <Panel title="Exam categories" onAdd={addCategory}>
          {categories.isLoading && <Empty>Loading…</Empty>}
          {categories.data?.length === 0 && <Empty>No categories yet. Add one.</Empty>}
          {categories.data?.map((c) => (
            <Row
              key={c._id}
              label={c.name}
              sub={c.slug}
              active={c.isActive}
              selected={catId === c._id}
              onSelect={() => {
                setCatId(c._id);
                setStageId(null);
                setSubjectId(null);
              }}
              onToggle={() => void run(() => adminContentApi.updateCategory(c._id, { isActive: !c.isActive }), catKey)}
              onRename={() => renameCategory(c)}
              onDelete={() => delCategory(c)}
            />
          ))}
        </Panel>

        <Panel title="Stages" onAdd={catId ? addStage : undefined}>
          {!catId && <Empty>Select a category.</Empty>}
          {catId && stages.isLoading && <Empty>Loading…</Empty>}
          {catId && stages.data?.length === 0 && <Empty>No stages yet. Add one.</Empty>}
          {catId &&
            stages.data?.map((s) => (
              <Row
                key={s._id}
                label={s.name}
                active={s.isActive}
                selected={stageId === s._id}
                onSelect={() => {
                  setStageId(s._id);
                  setSubjectId(null);
                }}
                onToggle={() => void run(() => adminContentApi.updateStage(s._id, { isActive: !s.isActive }), stageKey)}
                onRename={() => renameStage(s)}
                onDelete={() => delStage(s)}
              />
            ))}
        </Panel>

        <Panel title="Subjects" onAdd={stageId ? () => addSubject(null) : undefined}>
          {!stageId && <Empty>Select a stage.</Empty>}
          {stageId && subjects.isLoading && <Empty>Loading…</Empty>}
          {stageId && subjects.data?.length === 0 && <Empty>No subjects yet. Add one.</Empty>}
          {stageId && subjects.data && subjects.data.length > 0 && (
            <SubjectTree
              nodes={subjects.data}
              selectedId={subjectId}
              onSelect={setSubjectId}
              onAddChild={(id) => addSubject(id)}
              onRename={renameSubject}
              onToggle={(n) => void run(() => adminContentApi.updateSubject(n.id, { isActive: !n.isActive }), subjKey)}
              onDelete={delSubject}
            />
          )}
        </Panel>

        {subjectId && <LessonsPanel subjectId={subjectId} />}
      </div>
    </div>
  );
}

function Panel({ title, onAdd, children }: { title: string; onAdd?: () => void; children: ReactNode }) {
  return (
    <section className="min-w-[260px] flex-1 rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-display text-sm font-medium">{title}</h2>
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            + Add
          </Button>
        )}
      </div>
      <div className="space-y-0.5 p-2">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-2 py-3 text-sm text-muted">{children}</p>;
}

function Row({
  label,
  sub,
  active,
  selected,
  onSelect,
  onToggle,
  onRename,
  onDelete,
}: {
  label: string;
  sub?: string;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${selected ? 'bg-accent-soft' : 'hover:bg-canvas'}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex-1 truncate text-left text-sm ${selected ? 'text-accent' : 'text-ink'}`}
      >
        {label}
        {sub ? <span className="ml-1 font-mono text-xs text-muted">/{sub}</span> : null}
        {!active ? <span className="ml-2 text-xs text-danger">hidden</span> : null}
      </button>
      <IconButton title={active ? 'Unpublish' : 'Publish'} onClick={onToggle} label={active ? '◉' : '○'} />
      <IconButton title="Rename" onClick={onRename} label="✎" />
      <IconButton title="Delete" onClick={onDelete} label="🗑" />
    </div>
  );
}

function IconButton({ title, onClick, label }: { title: string; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded px-1.5 py-0.5 text-xs text-muted transition-colors hover:bg-line hover:text-ink"
    >
      {label}
    </button>
  );
}

function SubjectTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onToggle,
  onDelete,
  depth = 0,
}: {
  nodes: SubjectNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (id: string) => void;
  onRename: (n: SubjectNode) => void;
  onToggle: (n: SubjectNode) => void;
  onDelete: (n: SubjectNode) => void;
  depth?: number;
}) {
  return (
    <ul className={depth ? 'ml-3 border-l border-line pl-3' : ''}>
      {nodes.map((n) => (
        <li key={n.id} className="py-0.5">
          <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${selectedId === n.id ? 'bg-accent-soft' : 'hover:bg-canvas'}`}>
            <button
              type="button"
              onClick={() => onSelect(n.id)}
              className={`flex-1 truncate text-left text-sm ${selectedId === n.id ? 'text-accent' : 'text-ink'}`}
              title="Select to manage lessons"
            >
              {n.name}
              {!n.isActive ? <span className="ml-2 text-xs text-danger">hidden</span> : null}
            </button>
            <IconButton title="Add sub-subject" onClick={() => onAddChild(n.id)} label="＋" />
            <IconButton title={n.isActive ? 'Unpublish' : 'Publish'} onClick={() => onToggle(n)} label={n.isActive ? '◉' : '○'} />
            <IconButton title="Rename" onClick={() => onRename(n)} label="✎" />
            <IconButton title="Delete" onClick={() => onDelete(n)} label="🗑" />
          </div>
          {n.children.length > 0 && (
            <SubjectTree
              nodes={n.children}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onToggle={onToggle}
              onDelete={onDelete}
              depth={depth + 1}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

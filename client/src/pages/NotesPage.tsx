import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AppHeader, Badge, Button, Card, Select } from '../components/ui';
import { contentApi, type PubSubject } from '../features/content/content.api';
import { lessonsApi, type Lesson } from '../features/lessons/lessons.api';
import { purchase } from '../features/commerce/purchase';
import { SecureViewer } from '../components/SecureViewer';

export function NotesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [viewerLessonId, setViewerLessonId] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState('');

  const categories = useQuery({ queryKey: ['pub', 'categories'], queryFn: contentApi.categories });
  const stages = useQuery({ queryKey: ['pub', 'stages', catId], queryFn: () => contentApi.stages(catId), enabled: !!catId });
  const subjects = useQuery({ queryKey: ['pub', 'subjects', stageId], queryFn: () => contentApi.subjectTree(stageId), enabled: !!stageId });
  const lessons = useQuery({ queryKey: ['pub', 'lessons', subjectId], queryFn: () => lessonsApi.list(subjectId), enabled: !!subjectId });
  const progress = useQuery({ queryKey: ['pub', 'progress', subjectId], queryFn: () => lessonsApi.progress(subjectId), enabled: !!subjectId });

  async function toggleComplete(lesson: Lesson) {
    if (lesson.completed) await lessonsApi.uncomplete(lesson.id);
    else await lessonsApi.complete(lesson.id);
    await qc.invalidateQueries({ queryKey: ['pub', 'lessons', subjectId] });
    await qc.invalidateQueries({ queryKey: ['pub', 'progress', subjectId] });
  }

  async function buyLesson(lesson: Lesson) {
    setPurchaseError('');
    const coupon = window.prompt('Have a coupon code? (optional)')?.trim() || undefined;
    await purchase(
      [{ type: 'lesson', id: lesson.id }],
      () => void qc.invalidateQueries({ queryKey: ['pub', 'lessons', subjectId] }),
      setPurchaseError,
      coupon,
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        right={
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Notes</h1>

        <div className="mt-4 flex flex-wrap gap-3">
          <Select
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setStageId('');
              setSubjectId('');
            }}
            className="w-44"
          >
            <option value="">Select exam</option>
            {categories.data?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={stageId}
            onChange={(e) => {
              setStageId(e.target.value);
              setSubjectId('');
            }}
            disabled={!catId}
            className="w-44"
          >
            <option value="">Select stage</option>
            {stages.data?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>

        {stageId && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
            <Card className="p-3">
              <h2 className="mb-2 px-1 font-display text-sm font-medium">Subjects</h2>
              {subjects.data?.length ? (
                <SubjectNodes nodes={subjects.data} selectedId={subjectId} onSelect={setSubjectId} />
              ) : (
                <p className="px-1 text-sm text-muted">No subjects yet.</p>
              )}
            </Card>

            <Card className="p-4">
              {!subjectId && <p className="text-sm text-muted">Select a subject to see its notes.</p>}
              {subjectId && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-display text-sm font-medium">Lessons</h2>
                    {progress.data && (
                      <span className="font-mono text-xs text-muted">
                        {progress.data.completed}/{progress.data.total} done
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Alert>{purchaseError}</Alert>
                    {lessons.data?.length === 0 && <p className="text-sm text-muted">No lessons yet.</p>}
                    {lessons.data?.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onOpen={() => setViewerLessonId(lesson.id)}
                        onToggle={() => void toggleComplete(lesson)}
                        onBuy={() => void buyLesson(lesson)}
                      />
                    ))}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </main>

      {viewerLessonId && (
        <SecureViewer
          key={viewerLessonId}
          lessonId={viewerLessonId}
          onClose={() => {
            setViewerLessonId(null);
            void qc.invalidateQueries({ queryKey: ['pub', 'lessons', subjectId] });
            void qc.invalidateQueries({ queryKey: ['pub', 'progress', subjectId] });
          }}
        />
      )}
    </div>
  );
}

function SubjectNodes({
  nodes,
  selectedId,
  onSelect,
  depth = 0,
}: {
  nodes: PubSubject[];
  selectedId: string;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <ul className={depth ? 'ml-3 border-l border-line pl-2' : ''}>
      {nodes.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onSelect(n.id)}
            className={`block w-full truncate rounded px-2 py-1 text-left text-sm ${
              selectedId === n.id ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-canvas'
            }`}
          >
            {n.name}
          </button>
          {n.children.length > 0 && (
            <SubjectNodes nodes={n.children} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} />
          )}
        </li>
      ))}
    </ul>
  );
}

function LessonRow({
  lesson,
  onOpen,
  onToggle,
  onBuy,
}: {
  lesson: Lesson;
  onOpen: () => void;
  onToggle: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line p-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 truncate text-sm font-medium">
          {lesson.title}
          {lesson.completed && <Badge tone="success">done</Badge>}
          {lesson.locked && <Badge>locked</Badge>}
        </p>
        <p className="mt-0.5 flex items-center gap-2 text-xs text-muted">
          <Badge>{lesson.type}</Badge>
          <span className="font-mono">
            {lesson.type === 'pdf' ? `${lesson.pageCount ?? 0} pages` : 'Government link'}
          </span>
          {lesson.isFree ? <Badge tone="accent">free</Badge> : lesson.price ? <span className="font-mono">₹{lesson.price}</span> : null}
        </p>
      </div>

      {lesson.locked ? (
        <Button size="sm" onClick={onBuy}>
          Buy ₹{lesson.price}
        </Button>
      ) : lesson.type === 'pdf' ? (
        <>
          <Button size="sm" onClick={onOpen}>
            Open
          </Button>
          <Button variant="secondary" size="sm" onClick={onToggle}>
            {lesson.completed ? 'Undo' : 'Done'}
          </Button>
        </>
      ) : (
        <>
          <a
            href={lesson.externalUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-md border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink hover:bg-canvas"
          >
            Open ↗
          </a>
          <Button variant="secondary" size="sm" onClick={onToggle}>
            {lesson.completed ? 'Undo' : 'Done'}
          </Button>
        </>
      )}
    </div>
  );
}

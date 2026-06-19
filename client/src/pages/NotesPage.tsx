import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contentApi, type PubSubject } from '../features/content/content.api';
import { lessonsApi, type Lesson } from '../features/lessons/lessons.api';
import { SecureViewer } from '../components/SecureViewer';

export function NotesPage() {
  const qc = useQueryClient();
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [viewerLessonId, setViewerLessonId] = useState<string | null>(null);

  const categories = useQuery({ queryKey: ['pub', 'categories'], queryFn: contentApi.categories });
  const stages = useQuery({
    queryKey: ['pub', 'stages', catId],
    queryFn: () => contentApi.stages(catId),
    enabled: !!catId,
  });
  const subjects = useQuery({
    queryKey: ['pub', 'subjects', stageId],
    queryFn: () => contentApi.subjectTree(stageId),
    enabled: !!stageId,
  });
  const lessons = useQuery({
    queryKey: ['pub', 'lessons', subjectId],
    queryFn: () => lessonsApi.list(subjectId),
    enabled: !!subjectId,
  });
  const progress = useQuery({
    queryKey: ['pub', 'progress', subjectId],
    queryFn: () => lessonsApi.progress(subjectId),
    enabled: !!subjectId,
  });

  async function toggleComplete(lesson: Lesson) {
    if (lesson.completed) await lessonsApi.uncomplete(lesson.id);
    else await lessonsApi.complete(lesson.id);
    await qc.invalidateQueries({ queryKey: ['pub', 'lessons', subjectId] });
    await qc.invalidateQueries({ queryKey: ['pub', 'progress', subjectId] });
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <p className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-semibold text-transparent">
            Parallax Flow
          </p>
          <Link to="/dashboard" className="text-sm text-slate-400 hover:text-slate-100">
            ← Dashboard
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-medium">Notes</h1>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setStageId('');
              setSubjectId('');
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">Select exam</option>
            {categories.data?.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={stageId}
            onChange={(e) => {
              setStageId(e.target.value);
              setSubjectId('');
            }}
            disabled={!catId}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm disabled:opacity-40"
          >
            <option value="">Select stage</option>
            {stages.data?.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {stageId && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
            <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <h2 className="mb-2 px-1 text-sm font-medium">Subjects</h2>
              {subjects.data?.length ? (
                <SubjectNodes nodes={subjects.data} selectedId={subjectId} onSelect={setSubjectId} />
              ) : (
                <p className="px-1 text-sm text-slate-500">No subjects yet.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              {!subjectId && <p className="text-sm text-slate-500">Select a subject to see its notes.</p>}
              {subjectId && (
                <>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-medium">Lessons</h2>
                    {progress.data && (
                      <span className="text-xs text-slate-400">
                        {progress.data.completed}/{progress.data.total} completed
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {lessons.data?.length === 0 && <p className="text-sm text-slate-500">No lessons yet.</p>}
                    {lessons.data?.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onOpen={() => setViewerLessonId(lesson.id)}
                        onToggle={() => void toggleComplete(lesson)}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>

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
    <ul className={depth ? 'ml-3 border-l border-slate-800 pl-2' : ''}>
      {nodes.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onSelect(n.id)}
            className={`block w-full truncate rounded px-2 py-1 text-left text-sm ${selectedId === n.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
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
}: {
  lesson: Lesson;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const meta =
    lesson.type === 'pdf'
      ? `PDF · ${lesson.pageCount ?? 0} pages`
      : 'Government link';
  const priceTag = lesson.isFree ? ' · Free' : lesson.price ? ` · ₹${lesson.price}` : '';

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-800 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {lesson.title} {lesson.completed && <span className="text-emerald-400">✓</span>}
        </p>
        <p className="text-xs text-slate-500">
          {meta}
          {priceTag}
        </p>
      </div>
      {lesson.type === 'pdf' ? (
        <button type="button" onClick={onOpen} className="rounded bg-violet-600 px-3 py-1 text-sm hover:bg-violet-500">
          Open
        </button>
      ) : (
        <a
          href={lesson.externalUrl ?? '#'}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
        >
          Open ↗
        </a>
      )}
      <button type="button" onClick={onToggle} className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">
        {lesson.completed ? 'Undo' : 'Done'}
      </button>
    </div>
  );
}

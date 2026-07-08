import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card, useToast } from '../../components/ui';
import { CapArt } from '../../components/decor';
import { errorMessage } from '../auth/auth.api';
import { trackerApi } from '../tracker/tracker.api';
import { CatalogPicker, type CatalogSelection } from './CatalogPicker';

/**
 * One-time "choose your exam & stage" setup. Saves the choice as the student's
 * active stage (tracker settings), which personalises Notes, Practice and the
 * syllabus meter. Shown wherever no active stage exists yet.
 */
export function StageSetupCard({
  title = 'Set up your studies',
  description = 'Choose your exam and stage once — your notes, practice questions and syllabus tracking will be personalised to it. You can change it anytime in Tracker or Account.',
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const [sel, setSel] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });

  const save = useMutation({
    mutationFn: () => trackerApi.settings({ activeStageId: sel.stageId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracker'] });
      success('Stage saved', { description: 'Your app is now personalised to this stage.' });
    },
    onError: (err) => toastError(errorMessage(err)),
  });

  return (
    <Card className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <CapArt className="h-32 w-auto shrink-0 self-center sm:h-36" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
            <span className="pf-gold-rule" aria-hidden="true" />
            One-time setup
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-fg">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <CatalogPicker value={sel} onChange={setSel} includeSubject={false} layout="stack" />
          </div>
          <Button
            className="mt-4"
            disabled={!sel.stageId}
            loading={save.isPending}
            onClick={() => save.mutate()}
          >
            Save & personalise
          </Button>
        </div>
      </div>
    </Card>
  );
}

import { cn } from '../../lib/cn';
import { Combobox, type ComboOption } from '../../components/ui';
import { useCategories, useStages, useSubjectTree, flattenSubjects } from './useCatalog';

export type CatalogSelection = {
  categoryId: string | null;
  stageId: string | null;
  subjectId: string | null;
};

/**
 * Reusable Exam → Stage → Subject cascade. Selecting a parent resets its
 * descendants. Subject is optional (defaults to "all"). Searchable comboboxes.
 */
export function CatalogPicker({
  value,
  onChange,
  includeSubject = true,
  subjectAllLabel = 'All subjects',
  layout = 'grid',
  className,
}: {
  value: CatalogSelection;
  onChange: (next: CatalogSelection) => void;
  includeSubject?: boolean;
  subjectAllLabel?: string;
  layout?: 'grid' | 'stack';
  className?: string;
}) {
  const categories = useCategories();
  const stages = useStages(value.categoryId);
  const subjectTree = useSubjectTree(value.stageId);

  const categoryOptions: ComboOption[] =
    categories.data?.map((c) => ({ value: c._id, label: c.name })) ?? [];
  const stageOptions: ComboOption[] =
    stages.data?.map((s) => ({ value: s._id, label: s.name })) ?? [];
  const subjectOptions: ComboOption[] = subjectTree.data
    ? [
        { value: '', label: subjectAllLabel },
        ...flattenSubjects(subjectTree.data).map((s) => ({
          value: s.id,
          label: `${'  '.repeat(s.depth)}${s.depth > 0 ? '↳ ' : ''}${s.name}`,
        })),
      ]
    : [{ value: '', label: subjectAllLabel }];

  return (
    <div
      className={cn(
        layout === 'grid'
          ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col gap-3',
        className,
      )}
    >
      <Combobox
        label="Exam"
        value={value.categoryId}
        options={categoryOptions}
        placeholder={categories.isLoading ? 'Loading…' : 'Select exam'}
        onChange={(categoryId) => onChange({ categoryId, stageId: null, subjectId: null })}
      />
      <Combobox
        label="Stage"
        value={value.stageId}
        options={stageOptions}
        placeholder={!value.categoryId ? 'Pick an exam first' : stages.isLoading ? 'Loading…' : 'Select stage'}
        disabled={!value.categoryId}
        onChange={(stageId) => onChange({ ...value, stageId, subjectId: null })}
      />
      {includeSubject ? (
        <Combobox
          label="Subject"
          value={value.subjectId ?? ''}
          options={subjectOptions}
          placeholder={!value.stageId ? 'Pick a stage first' : 'All subjects'}
          disabled={!value.stageId}
          onChange={(subjectId) => onChange({ ...value, subjectId: subjectId || null })}
        />
      ) : null}
    </div>
  );
}

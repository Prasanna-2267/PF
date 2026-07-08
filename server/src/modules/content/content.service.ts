import { HttpError } from '../../middleware/error.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { ExamCategoryModel } from './exam-category.model.js';
import { StageModel } from './stage.model.js';
import { SubjectModel } from './subject.model.js';
import type {
  CreateCategoryInput,
  CreateStageInput,
  CreateSubjectInput,
} from './content.validation.js';

const byOrder = { order: 1, name: 1 } as const;
const activeFilter = (includeInactive: boolean) => (includeInactive ? {} : { isActive: true });

// ── Exam categories ───────────────────────────────────────────────
export function listCategories(includeInactive = false) {
  return ExamCategoryModel.find(activeFilter(includeInactive)).sort(byOrder).lean();
}

export async function createCategory(data: CreateCategoryInput) {
  if (await ExamCategoryModel.exists({ slug: data.slug })) {
    throw new HttpError(409, 'A category with this slug already exists');
  }
  return ExamCategoryModel.create(data);
}

export async function updateCategory(id: string, data: Partial<CreateCategoryInput>) {
  const doc = await ExamCategoryModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new HttpError(404, 'Category not found');
  return doc;
}

export async function deleteCategory(id: string): Promise<void> {
  if (await StageModel.exists({ examCategoryId: id })) {
    throw new HttpError(409, "Remove this category's stages first");
  }
  const doc = await ExamCategoryModel.findByIdAndDelete(id);
  if (!doc) throw new HttpError(404, 'Category not found');
}

// ── Stages ────────────────────────────────────────────────────────
export function listStages(examCategoryId: string, includeInactive = false) {
  return StageModel.find({ examCategoryId, ...activeFilter(includeInactive) })
    .sort(byOrder)
    .lean();
}

export async function createStage(data: CreateStageInput) {
  if (!(await ExamCategoryModel.exists({ _id: data.examCategoryId }))) {
    throw new HttpError(400, 'Invalid examCategoryId');
  }
  return StageModel.create(data);
}

export async function updateStage(id: string, data: Partial<CreateStageInput>) {
  const doc = await StageModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new HttpError(404, 'Stage not found');
  return doc;
}

export async function deleteStage(id: string): Promise<void> {
  if (await SubjectModel.exists({ stageId: id })) {
    throw new HttpError(409, "Remove this stage's subjects first");
  }
  const doc = await StageModel.findByIdAndDelete(id);
  if (!doc) throw new HttpError(404, 'Stage not found');
}

// ── Subjects (tree) ───────────────────────────────────────────────

/**
 * A subject holds EITHER sub-subjects OR notes — never both. Reject turning a
 * subject that already has notes into a parent (it must be a leaf to hold notes).
 */
async function assertParentHasNoLessons(parentSubjectId: string): Promise<void> {
  if (await LessonModel.exists({ subjectId: parentSubjectId })) {
    throw new HttpError(
      409,
      'This subject already has notes. A subject can hold notes or sub-subjects, but not both — move its notes into a sub-subject first.',
      { code: 'SUBJECT_HAS_NOTES' },
    );
  }
}

/**
 * Convert a notes-bearing subject into a parent: create a leaf sub-subject
 * (`holderName`, e.g. "General") and move all of the subject's notes into it.
 * Non-destructive — lessons keep their id, so student progress, revisions and
 * purchases are preserved (only the subject pointer changes).
 */
export async function subdivideSubject(parentId: string, holderName: string) {
  const parent = await SubjectModel.findById(parentId);
  if (!parent) throw new HttpError(404, 'Subject not found');
  if (await SubjectModel.exists({ parentSubjectId: parentId })) {
    throw new HttpError(409, 'This subject already has sub-subjects.');
  }
  const holder = await SubjectModel.create({
    name: holderName,
    stageId: parent.stageId,
    parentSubjectId: parent._id,
  });
  await LessonModel.updateMany({ subjectId: parentId }, { $set: { subjectId: holder._id } });
  return holder;
}

type SubjectNode = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  parentSubjectId: string | null;
  children: SubjectNode[];
  lessonCount: number; // total lessons beneath this node (rolled up)
};

export async function getSubjectTree(stageId: string, includeInactive = false): Promise<SubjectNode[]> {
  const subjects = await SubjectModel.find({ stageId, ...activeFilter(includeInactive) })
    .sort(byOrder)
    .lean();

  // Direct lesson count per subject; rolled up recursively so every node reports
  // how many lessons live beneath it (students see "N lessons" on each card).
  const lessonAgg = await LessonModel.aggregate([
    {
      $match: {
        subjectId: { $in: subjects.map((s) => s._id) },
        ...(includeInactive ? {} : { isActive: true }),
      },
    },
    { $group: { _id: '$subjectId', n: { $sum: 1 } } },
  ]);
  const directCount = new Map<string, number>(
    (lessonAgg as { _id: unknown; n: number }[]).map((r) => [String(r._id), r.n]),
  );

  const nodes = new Map<string, SubjectNode>();
  for (const s of subjects) {
    const id = String(s._id);
    nodes.set(id, {
      id,
      name: s.name,
      order: s.order,
      isActive: s.isActive,
      parentSubjectId: s.parentSubjectId ? String(s.parentSubjectId) : null,
      children: [],
      lessonCount: directCount.get(id) ?? 0,
    });
  }

  const roots: SubjectNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentSubjectId ? nodes.get(node.parentSubjectId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const rollup = (node: SubjectNode): number => {
    let sum = node.lessonCount;
    for (const child of node.children) sum += rollup(child);
    node.lessonCount = sum;
    return sum;
  };
  roots.forEach(rollup);

  return roots;
}

export async function createSubject(data: CreateSubjectInput) {
  if (!(await StageModel.exists({ _id: data.stageId }))) {
    throw new HttpError(400, 'Invalid stageId');
  }
  if (data.parentSubjectId) {
    const parent = await SubjectModel.findById(data.parentSubjectId);
    if (!parent) throw new HttpError(400, 'Invalid parentSubjectId');
    if (String(parent.stageId) !== String(data.stageId)) {
      throw new HttpError(400, 'Parent subject must be in the same stage');
    }
    await assertParentHasNoLessons(data.parentSubjectId);
  }
  return SubjectModel.create(data);
}

export async function updateSubject(id: string, data: Partial<CreateSubjectInput>) {
  if (data.parentSubjectId) {
    if (data.parentSubjectId === id) throw new HttpError(400, 'A subject cannot be its own parent');
    const parent = await SubjectModel.findById(data.parentSubjectId);
    if (!parent) throw new HttpError(400, 'Invalid parentSubjectId');
    await assertParentHasNoLessons(data.parentSubjectId);
  }
  const doc = await SubjectModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!doc) throw new HttpError(404, 'Subject not found');
  return doc;
}

export async function deleteSubject(id: string): Promise<void> {
  if (await SubjectModel.exists({ parentSubjectId: id })) {
    throw new HttpError(409, 'Remove this subject’s sub-subjects first');
  }
  const doc = await SubjectModel.findByIdAndDelete(id);
  if (!doc) throw new HttpError(404, 'Subject not found');
}

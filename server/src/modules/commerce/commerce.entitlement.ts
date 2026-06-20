import { OrderModel } from './order.model.js';
import { PackageModel } from './package.model.js';

/** Lessons a user owns — directly purchased or via a purchased package (live). */
export async function getOwnedLessonIds(userId: string): Promise<Set<string>> {
  const orders = await OrderModel.find({ userId, status: 'paid' }).select('items').lean();
  const owned = new Set<string>();
  const packageIds: string[] = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (item.type === 'lesson') owned.add(String(item.refId));
      else packageIds.push(String(item.refId));
    }
  }

  if (packageIds.length) {
    const pkgs = await PackageModel.find({ _id: { $in: packageIds } }).select('lessonIds').lean();
    for (const pkg of pkgs) {
      for (const lid of pkg.lessonIds ?? []) owned.add(String(lid));
    }
  }
  return owned;
}

export async function hasLessonAccess(userId: string, lessonId: string): Promise<boolean> {
  const owned = await getOwnedLessonIds(userId);
  return owned.has(String(lessonId));
}

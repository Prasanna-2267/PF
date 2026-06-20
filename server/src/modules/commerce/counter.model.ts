import { Schema, model } from 'mongoose';

/** Atomic named counters (e.g. per-year receipt sequence). */
const counterSchema = new Schema({
  _id: { type: String, required: true }, // e.g. "receipt-2026"
  seq: { type: Number, default: 0 },
});

export const CounterModel = model('Counter', counterSchema);

/** Atomically increment and return the next value for a named counter. */
export async function nextSeq(name: string): Promise<number> {
  const doc = await CounterModel.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  return doc!.seq;
}

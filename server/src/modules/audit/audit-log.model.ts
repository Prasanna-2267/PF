import { Schema, model, type InferSchemaType } from 'mongoose';

/**
 * Audit trail for admin mutations (create/update/delete on content, lessons,
 * packages, coupons, questions). Fulfils the "audit logs for admin actions"
 * commitment in docs/SECURITY.md §5. Written non-blocking after each successful
 * admin write; never affects the response.
 */
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorRole: { type: String, required: true },
    method: { type: String, required: true }, // POST | PATCH | PUT | DELETE
    resource: { type: String, required: true, index: true }, // content | lessons | commerce | questions
    path: { type: String, required: true },
    resourceId: { type: String }, // affected document id, when present in the route
    statusCode: { type: Number, required: true },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export type AuditLog = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel = model('AuditLog', auditLogSchema);

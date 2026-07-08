import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const USER_ROLES = ['student', 'admin', 'superadmin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String }, // absent for Google-only accounts
    phone: { type: String, trim: true }, // required for email signup; collected later for SSO
    role: { type: String, enum: USER_ROLES, default: 'student', index: true },
    emailVerified: { type: Boolean, default: false },
    // Admin can disable an account: blocks every login path + kills live sessions.
    disabled: { type: Boolean, default: false, index: true },

    // Profile picture: an uploaded avatar (in object storage) and/or the Google
    // account picture used by default for SSO users.
    hasAvatar: { type: Boolean, default: false },
    avatarUpdatedAt: { type: Date },
    googleAvatarUrl: { type: String },
    googleId: { type: String, index: true, sparse: true },
    activeStageId: { type: Schema.Types.ObjectId, ref: 'Stage' },

    // Study tracker (Phase 5)
    examDate: { type: Date },
    examLabel: { type: String, trim: true },
    dailyTargetMinutes: { type: Number, default: 60 },
  },
  { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model('User', userSchema);

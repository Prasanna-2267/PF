import { Schema, model, type InferSchemaType } from 'mongoose';

/** Single app-wide settings document: looping announcement messages + Telegram links. */
const settingSchema = new Schema(
  {
    key: { type: String, default: 'app', unique: true },
    announcements: {
      type: [
        {
          text: { type: String, default: '' },
          active: { type: Boolean, default: true },
        },
      ],
      default: [],
    },
    telegramGroupUrl: { type: String, default: '' },
    telegramChannelUrl: { type: String, default: '' },
  },
  { timestamps: true },
);

export type SettingDoc = InferSchemaType<typeof settingSchema>;
export const SettingModel = model('Setting', settingSchema);

import { SettingModel } from './settings.model.js';
import type { UpdateSettingsInput } from './settings.validation.js';

/** The single settings doc, created with defaults on first access. */
async function getSettings() {
  const existing = await SettingModel.findOne({ key: 'app' });
  return existing ?? (await SettingModel.create({ key: 'app' }));
}

export async function getAdminSettings() {
  const s = await getSettings();
  return {
    announcements: s.announcements.map((a) => ({ text: a.text, active: a.active })),
    telegramGroupUrl: s.telegramGroupUrl,
    telegramChannelUrl: s.telegramChannelUrl,
  };
}

export async function updateSettings(input: UpdateSettingsInput) {
  const s = await getSettings();
  const patch: Record<string, unknown> = {};
  if (input.announcements !== undefined) patch.announcements = input.announcements;
  if (input.telegramGroupUrl !== undefined) patch.telegramGroupUrl = input.telegramGroupUrl;
  if (input.telegramChannelUrl !== undefined) patch.telegramChannelUrl = input.telegramChannelUrl;
  s.set(patch);
  await s.save();
  return getAdminSettings();
}

/** Public home payload: active, non-empty announcement messages (in order) + Telegram links. */
export async function getPublicHome() {
  const s = await getSettings();
  return {
    announcements: s.announcements
      .filter((a) => a.active && a.text.trim())
      .map((a) => a.text.trim()),
    telegram: {
      groupUrl: s.telegramGroupUrl.trim() || null,
      channelUrl: s.telegramChannelUrl.trim() || null,
    },
  };
}

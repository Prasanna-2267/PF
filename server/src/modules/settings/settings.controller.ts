import type { RequestHandler } from 'express';
import * as settings from './settings.service.js';
import { updateSettingsSchema } from './settings.validation.js';

export const home: RequestHandler = async (_req, res) => {
  res.json(await settings.getPublicHome());
};

export const getAdmin: RequestHandler = async (_req, res) => {
  res.json({ settings: await settings.getAdminSettings() });
};

export const update: RequestHandler = async (req, res) => {
  res.json({ settings: await settings.updateSettings(updateSettingsSchema.parse(req.body)) });
};

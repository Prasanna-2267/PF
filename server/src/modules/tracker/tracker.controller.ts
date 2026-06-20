import type { RequestHandler } from 'express';
import * as tracker from './tracker.service.js';
import { settingsSchema } from './tracker.validation.js';

export const get: RequestHandler = async (req, res) => {
  res.json(await tracker.getTracker(req.auth!.sub));
};

export const checkIn: RequestHandler = async (req, res) => {
  res.json(await tracker.checkIn(req.auth!.sub));
};

export const checkOut: RequestHandler = async (req, res) => {
  res.json(await tracker.checkOut(req.auth!.sub));
};

export const settings: RequestHandler = async (req, res) => {
  res.json(await tracker.updateSettings(req.auth!.sub, settingsSchema.parse(req.body)));
};

import type { RequestHandler } from 'express';
import { HttpError } from '../../middleware/error.js';
import { isPaymentsConfigured } from '../../services/razorpay.js';
import * as commerce from './commerce.service.js';
import {
  createOrderSchema,
  createPackageSchema,
  updatePackageSchema,
  verifyPaymentSchema,
} from './commerce.validation.js';

// ── Student / checkout ──
export const listPackages: RequestHandler = async (_req, res) => {
  res.json({ packages: await commerce.listPackages(false), paymentsEnabled: isPaymentsConfigured() });
};

export const createOrder: RequestHandler = async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  res.status(201).json(await commerce.createOrder(req.auth!.sub, input));
};

export const verifyPayment: RequestHandler = async (req, res) => {
  const input = verifyPaymentSchema.parse(req.body);
  res.json(await commerce.verifyPayment(req.auth!.sub, input));
};

export const myPurchases: RequestHandler = async (req, res) => {
  res.json(await commerce.myPurchases(req.auth!.sub));
};

export const webhook: RequestHandler = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (typeof signature !== 'string' || !req.rawBody) throw new HttpError(400, 'Missing webhook signature');
  await commerce.handleWebhook(req.rawBody, signature);
  res.json({ ok: true });
};

// ── Admin packages ──
export const listAdminPackages: RequestHandler = async (_req, res) => {
  res.json({ packages: await commerce.listPackages(true) });
};

export const createPackage: RequestHandler = async (req, res) => {
  res.status(201).json({ package: await commerce.createPackage(createPackageSchema.parse(req.body)) });
};

export const updatePackage: RequestHandler = async (req, res) => {
  res.json({ package: await commerce.updatePackage(req.params.id!, updatePackageSchema.parse(req.body)) });
};

export const deletePackage: RequestHandler = async (req, res) => {
  await commerce.deletePackage(req.params.id!);
  res.json({ ok: true });
};

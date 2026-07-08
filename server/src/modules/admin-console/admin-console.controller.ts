import type { RequestHandler } from 'express';
import * as svc from './admin-console.service.js';
import {
  disabledSchema,
  grantSchema,
  listOrdersQuery,
  listUsersQuery,
  roleSchema,
} from './admin-console.validation.js';

export const overview: RequestHandler = async (_req, res) => {
  res.json(await svc.getOverview());
};

export const listUsers: RequestHandler = async (req, res) => {
  res.json(await svc.listUsers(listUsersQuery.parse(req.query)));
};

export const userDetail: RequestHandler = async (req, res) => {
  res.json(await svc.getUserDetail(req.params.id!));
};

export const setRole: RequestHandler = async (req, res) => {
  const { role } = roleSchema.parse(req.body);
  res.json(await svc.setUserRole(req.auth!.sub, req.params.id!, role));
};

export const setStatus: RequestHandler = async (req, res) => {
  const { disabled } = disabledSchema.parse(req.body);
  res.json(await svc.setUserDisabled(req.auth!.sub, req.params.id!, disabled));
};

export const forceLogout: RequestHandler = async (req, res) => {
  res.json(await svc.forceLogoutUser(req.params.id!));
};

export const grant: RequestHandler = async (req, res) => {
  const { type, refId } = grantSchema.parse(req.body);
  res.status(201).json(await svc.grantAccess(req.params.id!, { type, refId }));
};

export const listOrders: RequestHandler = async (req, res) => {
  res.json(await svc.listOrders(listOrdersQuery.parse(req.query)));
};

export const refund: RequestHandler = async (req, res) => {
  res.json(await svc.refundOrder(req.auth!.sub, req.params.id!));
};

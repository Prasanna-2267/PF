import type { RequestHandler } from 'express';
import * as questions from './question.service.js';
import { createQuestionSchema, submitAnswerSchema, updateQuestionSchema } from './question.validation.js';

// ── Admin ──
export const listAdmin: RequestHandler = async (req, res) => {
  const { stageId, subjectId, type } = req.query as Record<string, string | undefined>;
  if (!stageId) {
    res.status(400).json({ error: 'stageId is required' });
    return;
  }
  res.json({ questions: await questions.listQuestionsAdmin(stageId, { subjectId, type }) });
};

export const create: RequestHandler = async (req, res) => {
  const data = createQuestionSchema.parse(req.body);
  res.status(201).json({ question: await questions.createQuestion(data, req.auth!.sub) });
};

export const update: RequestHandler = async (req, res) => {
  const data = updateQuestionSchema.parse(req.body);
  res.json({ question: await questions.updateQuestion(req.params.id!, data) });
};

export const remove: RequestHandler = async (req, res) => {
  await questions.deleteQuestion(req.params.id!);
  res.json({ ok: true });
};

// ── Student ──
export const listForStudent: RequestHandler = async (req, res) => {
  const { stageId, subjectId } = req.query as Record<string, string | undefined>;
  if (!stageId) {
    res.status(400).json({ error: 'stageId is required' });
    return;
  }
  res.json({ questions: await questions.listForStudent(stageId, subjectId) });
};

export const answer: RequestHandler = async (req, res) => {
  const input = submitAnswerSchema.parse(req.body);
  res.json(await questions.submitAnswer(req.auth!.sub, req.params.id!, input));
};

export const stats: RequestHandler = async (req, res) => {
  const { stageId } = req.query as Record<string, string | undefined>;
  res.json(await questions.getStats(req.auth!.sub, stageId));
};

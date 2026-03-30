import type { Request, Response } from 'express';
import { HttpError } from '../utils/errors.js';
import { getMyNotifications, getUnreadCount, markAllAsRead, markAsRead } from '../services/notifications.service.js';

function requireUser(req: Request) {
  if (!req.user) {
    throw new HttpError(401, 'Authentication required');
  }

  return req.user;
}

export async function listMyNotifications(req: Request, res: Response) {
  const notifications = await getMyNotifications(requireUser(req).id);
  res.json({ notifications });
}

export async function unreadNotificationCount(req: Request, res: Response) {
  const count = await getUnreadCount(requireUser(req).id);
  res.json(count);
}

export async function readNotification(req: Request, res: Response) {
  const notification = await markAsRead(requireUser(req).id, req.params.notificationId);
  res.json({ notification });
}

export async function readAllNotifications(req: Request, res: Response) {
  const result = await markAllAsRead(requireUser(req).id);
  res.json(result);
}
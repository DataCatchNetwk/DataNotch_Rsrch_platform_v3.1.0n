import { api } from '@/lib/api/client';

export type UserCommunicationSummary = {
  userId: string;
  counts: {
    inbox: number;
    notifications: number;
    meetings: number;
    messages: number;
    tasks: number;
    invitations: number;
    announcements: number;
    supportTickets: number;
  };
};

export type InboxThread = {
  id: string;
  category: string;
  title: string;
  body: string;
  unread: boolean;
};

export type AssetType = 'PROJECT' | 'STUDY' | 'DATASET' | 'ANALYSIS' | 'PUBLICATION';

export type AssetDiscussionMessage = {
  id: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

export type AssetDiscussion = {
  assetType: AssetType;
  assetId: string;
  messages: AssetDiscussionMessage[];
};

export async function getUserCommunicationSummary() {
  const { data } = await api.get('/v1/user-communication/summary');
  return data as UserCommunicationSummary;
}

export async function getUserCommunicationInbox() {
  const { data } = await api.get('/v1/user-communication/inbox');
  return data as InboxThread[];
}

export async function getAssetDiscussion(assetType: AssetType, assetId: string) {
  const { data } = await api.get(`/v1/user-communication/assets/${assetType}/${assetId}/discussion`);
  return data as AssetDiscussion;
}

export async function sendAssetDiscussionMessage(assetType: AssetType, assetId: string, body: string) {
  const { data } = await api.post(`/v1/user-communication/assets/${assetType}/${assetId}/messages`, { body });
  return data as {
    id: string;
    senderId: string;
    assetType: AssetType;
    assetId: string;
    body: string;
    createdAt: string;
  };
}

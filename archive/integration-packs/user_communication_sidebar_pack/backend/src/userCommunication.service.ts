export type AssetType = 'PROJECT' | 'STUDY' | 'DATASET' | 'ANALYSIS' | 'PUBLICATION';

export const userCommunicationService = {
  async getSidebarSummary(userId: string) {
    return {
      userId,
      counts: {
        inbox: 12,
        notifications: 8,
        meetings: 3,
        messages: 6,
        tasks: 5,
        invitations: 4,
        announcements: 2,
        supportTickets: 2,
      },
    };
  },

  async getInbox(userId: string) {
    return [
      { id: '1', category: 'STUDY_INVITATION', title: 'NeuroTwinFM Study', body: 'You were invited to join the clinical validation team.', unread: true },
      { id: '2', category: 'DATASET_REVIEW', title: 'Clinical_SDOH_v4', body: 'Please review missingness and data quality flags.', unread: true },
      { id: '3', category: 'ADMIN_MESSAGE', title: 'Account Update', body: 'Your platform permissions were updated.', unread: false },
    ];
  },

  async getAssetDiscussion(assetType: AssetType, assetId: string) {
    return {
      assetType,
      assetId,
      messages: [
        { id: 'm1', senderRole: 'Admin', body: 'Need missing values review and quality validation before approval.', createdAt: new Date().toISOString() },
        { id: 'm2', senderRole: 'Researcher', body: 'I will validate the feature set and send notes tomorrow.', createdAt: new Date().toISOString() },
        { id: 'm3', senderRole: 'Data Steward', body: 'Approved after harmonization checks are attached.', createdAt: new Date().toISOString() },
      ],
    };
  },

  async sendAssetMessage(input: { userId: string; assetType: AssetType; assetId: string; body: string }) {
    return {
      id: crypto.randomUUID(),
      senderId: input.userId,
      assetType: input.assetType,
      assetId: input.assetId,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
  },
};

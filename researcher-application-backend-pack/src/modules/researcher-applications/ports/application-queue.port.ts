export const APPLICATION_QUEUE_PORT = Symbol('APPLICATION_QUEUE_PORT');

export interface ApplicationQueuePort {
  enqueueNewSubmission(params: {
    applicationId: string;
    userId: string;
    email: string;
    institution: string;
  }): Promise<void>;

  enqueueReviewCompleted(params: {
    applicationId: string;
    userId: string;
    reviewStatus: string;
  }): Promise<void>;
}

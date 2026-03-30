import { ApplicationReviewStatus } from '../types/researcher-application.types';

export const APPLICATION_MAILER_PORT = Symbol('APPLICATION_MAILER_PORT');

export interface ApplicationMailerPort {
  sendSubmissionReceivedEmail(params: {
    to: string;
    applicantName: string;
    applicationId: string;
    institution: string;
  }): Promise<void>;

  sendNeedsMoreInfoEmail(params: {
    to: string;
    applicantName: string;
    applicationId: string;
    notes?: string | null;
  }): Promise<void>;

  sendReviewDecisionEmail(params: {
    to: string;
    applicantName: string;
    applicationId: string;
    reviewStatus: ApplicationReviewStatus;
    notes?: string | null;
  }): Promise<void>;
}

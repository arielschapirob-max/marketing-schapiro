import type { MeetingAnalysisOutput, PersonalizedQuestionnaireOutput } from './schemas';

export interface AIProviderInfo {
  provider: string;
  model: string;
}

export interface MeetingAnalysisRequest {
  transcriptText: string;
  organizationContext: {
    legalName: string;
    knownSectors: string[];
  };
}

export interface PersonalizedQuestionnaireRequest {
  organizationContext: {
    legalName: string;
    commercialName: string | null;
    website: string | null;
    contactName: string | null;
  };
  transcriptExcerpts: string[];
  webFindingSummaries: string[];
  existingFindingSummaries: string[];
  sectorNames: string[];
}

export interface AIProvider extends AIProviderInfo {
  analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput>;
  generatePersonalizedQuestionnaire(req: PersonalizedQuestionnaireRequest): Promise<PersonalizedQuestionnaireOutput>;
}

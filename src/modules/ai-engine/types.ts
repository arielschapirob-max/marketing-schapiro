import type { MeetingAnalysisOutput } from './schemas';

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

export interface AIProvider extends AIProviderInfo {
  analyzeMeetingTranscript(req: MeetingAnalysisRequest): Promise<MeetingAnalysisOutput>;
}

export interface LeadIntelligenceInput {
  leadId: string;
  interest: string;
  urgency: string;
  budgetRange: string;
  notes: string | null;
}
export interface LeadIntelligenceResult {
  summary: string;
  rationale: string;
  interests: string[];
  recommendedAction: string;
  suggestedMessage: string;
  metadata: { provider: string; model: string; analyzedAt: string; source: 'external-provider' };
}
export interface LeadIntelligenceProvider {
  analyzeLead(input: LeadIntelligenceInput): Promise<LeadIntelligenceResult>;
}


export interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export interface ConversationState {
  messages: ConversationMessage[];
  isComplete: boolean;
  userProfile: {
    gender?: string;
    preferences?: string[];
    occasions?: string[];
    intensity?: string;
    budget?: string;
    familyPreference?: string;
    additionalInfo?: string;
  };
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  recommendations?: string[];
  needsRecommendations?: boolean;
  showAnimation?: boolean;
}

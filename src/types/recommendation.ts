
export interface RecommendationAnswers {
  gender: string;
  family: string;
  occasion: string;
  intensity: string;
  budget: string;
  preferences: string;
}

export interface RecommendationResult {
  perfumeIds: string[];
}

export interface AIProvider {
  id: string;
  name: string;
  api_key_env: string;
  model: string;
  temperature: number;
  is_default: boolean;
  created_at: string;
}

export interface RecommendationSession {
  id: string;
  user_id: string | null;
  answers_json: RecommendationAnswers;
  recommended_json: RecommendationResult | null;
  ai_provider_id: string;
  created_at: string;
}

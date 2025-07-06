import { trackEvent } from './analytics';

// Advanced e-commerce analytics
export const trackProductView = (product: {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  price: number;
}) => {
  trackEvent('view_item', {
    currency: 'BRL',
    value: product.price,
    items: [product]
  });
};

export const trackSearchQuery = (query: string, results: number) => {
  trackEvent('search', {
    search_term: query,
    results_count: results
  });
};

export const trackRecommendationView = (items: Array<{
  item_id: string;
  item_name: string;
  item_brand: string;
  position: number;
}>) => {
  trackEvent('view_item_list', {
    item_list_id: 'recommendations',
    item_list_name: 'Curadoria Recommendations',
    items: items.map(item => ({
      ...item,
      index: item.position
    }))
  });
};

export const trackRecommendationClick = (item: {
  item_id: string;
  item_name: string;
  item_brand: string;
  position: number;
}) => {
  trackEvent('select_item', {
    item_list_id: 'recommendations',
    item_list_name: 'Curadoria Recommendations',
    items: [{
      ...item,
      index: item.position
    }]
  });
};

export const trackFormStart = (formName: string) => {
  trackEvent('form_start', {
    form_name: formName,
    timestamp: Date.now()
  });
};

export const trackFormComplete = (formName: string, duration: number) => {
  trackEvent('form_complete', {
    form_name: formName,
    completion_time: duration,
    timestamp: Date.now()
  });
};

export const trackFormAbandon = (formName: string, step: string, duration: number) => {
  trackEvent('form_abandon', {
    form_name: formName,
    abandoned_at_step: step,
    time_spent: duration,
    timestamp: Date.now()
  });
};

export const trackUserEngagement = (action: string, category: string, value?: number) => {
  trackEvent('user_engagement', {
    engagement_type: action,
    category,
    value,
    timestamp: Date.now()
  });
};

export const trackFeatureUsage = (feature: string, context?: string) => {
  trackEvent('feature_usage', {
    feature_name: feature,
    usage_context: context,
    timestamp: Date.now()
  });
};

export const trackErrorEvent = (error: string, context: string, severity: 'low' | 'medium' | 'high' = 'medium') => {
  trackEvent('app_error', {
    error_message: error,
    error_context: context,
    severity,
    timestamp: Date.now()
  });
};

export const trackPerformanceMetric = (metric: string, value: number, context?: string) => {
  trackEvent('performance_metric', {
    metric_name: metric,
    metric_value: value,
    measurement_context: context,
    timestamp: Date.now()
  });
};

// Business-specific analytics
export const trackCuradoriaSession = (sessionData: {
  session_id: string;
  questions_answered: number;
  recommendations_generated: number;
  session_duration: number;
  conversion: boolean;
}) => {
  trackEvent('curadoria_session', {
    ...sessionData,
    timestamp: Date.now()
  });
};

export const trackLoyaltyAction = (action: 'points_earned' | 'points_redeemed' | 'tier_upgrade', data: {
  points_amount?: number;
  tier_from?: string;
  tier_to?: string;
  source?: string;
}) => {
  trackEvent('loyalty_action', {
    action,
    ...data,
    timestamp: Date.now()
  });
};

export const trackCustomerLifecycle = (stage: 'visitor' | 'prospect' | 'customer' | 'advocate', data?: any) => {
  trackEvent('customer_lifecycle', {
    lifecycle_stage: stage,
    additional_data: data,
    timestamp: Date.now()
  });
};
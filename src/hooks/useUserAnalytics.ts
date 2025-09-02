import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';
import { generateUUID } from '@/lib/uuid';

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActive: number;
  pageViews: number;
  events: Array<{
    type: string;
    timestamp: number;
    data?: any;
  }>;
}

export const useUserAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Initialize or get session
  const getSession = useCallback((): UserSession => {
    const sessionKey = 'paris_co_analytics_session';
    const stored = sessionStorage.getItem(sessionKey);
    
    if (stored) {
      try {
        const session: UserSession = JSON.parse(stored);
        // Session expires after 30 minutes of inactivity
        if (Date.now() - session.lastActive < 30 * 60 * 1000) {
          return session;
        }
      } catch (e) {
        console.warn('Failed to parse stored session');
      }
    }

    // Create new session
    const newSession: UserSession = {
      sessionId: generateUUID(),
      startTime: Date.now(),
      lastActive: Date.now(),
      pageViews: 0,
      events: []
    };

    sessionStorage.setItem(sessionKey, JSON.stringify(newSession));
    return newSession;
  }, []);

  // Update session activity
  const updateSession = useCallback((updates: Partial<UserSession>) => {
    const sessionKey = 'paris_co_analytics_session';
    const session = getSession();
    const updatedSession = {
      ...session,
      ...updates,
      lastActive: Date.now()
    };
    
    sessionStorage.setItem(sessionKey, JSON.stringify(updatedSession));
    return updatedSession;
  }, [getSession]);

  // Track page view
  const trackPageView = useCallback((path: string, title: string) => {
    const session = updateSession({
      pageViews: getSession().pageViews + 1,
      events: [...getSession().events, {
        type: 'page_view',
        timestamp: Date.now(),
        data: { path, title }
      }]
    });

    // GA4 page view
    trackEvent('page_view', {
      page_title: title,
      page_location: window.location.href,
      page_path: path,
      session_id: session.sessionId,
      user_id: user?.id || 'anonymous'
    });

    // Log to access_logs table
    if (navigator.geolocation) {
      logAccess(path);
    }
  }, [updateSession, getSession, user]);

  // Log access to database
  const logAccess = async (route: string) => {
    try {
      const userAgent = navigator.userAgent;
      
      await supabase.from('access_logs').insert({
        user_id: user?.id || null,
        route,
        user_agent: userAgent,
        ip_address: null // Will be set by RLS if available
      });
    } catch (error) {
      console.warn('Failed to log access:', error);
    }
  };

  // Track custom events
  const trackCustomEvent = useCallback((eventType: string, data?: any) => {
    const session = updateSession({
      events: [...getSession().events, {
        type: eventType,
        timestamp: Date.now(),
        data
      }]
    });

    // GA4 custom event
    trackEvent(eventType, {
      ...data,
      session_id: session.sessionId,
      user_id: user?.id || 'anonymous',
      timestamp: Date.now()
    });
  }, [updateSession, getSession, user]);

  // Track user interactions
  const trackInteraction = useCallback((element: string, action: string, value?: string | number) => {
    trackCustomEvent('user_interaction', {
      element,
      action,
      value,
      page: location.pathname
    });
  }, [trackCustomEvent, location.pathname]);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const depths = [25, 50, 75, 90, 100];
    let trackedDepths: number[] = [];

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const winHeight = window.innerHeight;
      const scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);

      depths.forEach(depth => {
        if (scrollPercent >= depth && !trackedDepths.includes(depth)) {
          trackedDepths.push(depth);
          trackCustomEvent('scroll_depth', {
            depth,
            page: location.pathname
          });
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [trackCustomEvent, location.pathname]);

  // Track session duration on page unload
  const trackSessionEnd = useCallback(() => {
    const session = getSession();
    const sessionDuration = Date.now() - session.startTime;

    trackCustomEvent('session_end', {
      session_duration: sessionDuration,
      page_views: session.pageViews,
      events_count: session.events.length
    });
  }, [getSession, trackCustomEvent]);

  // Track route changes
  useEffect(() => {
    const title = document.title || location.pathname;
    trackPageView(location.pathname, title);
  }, [location.pathname, trackPageView]);

  // Track scroll depth on mount
  useEffect(() => {
    const cleanup = trackScrollDepth();
    return cleanup;
  }, [trackScrollDepth]);

  // Track session end
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [trackSessionEnd]);

  return {
    trackCustomEvent,
    trackInteraction,
    getSession
  };
};
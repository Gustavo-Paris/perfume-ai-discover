import { supabase } from '@/integrations/supabase/client';

// Force logout and clear all data
(async () => {
  await supabase.auth.signOut();
  // Clear local storage
  localStorage.clear();
  // Force reload
  window.location.href = '/auth';
})();
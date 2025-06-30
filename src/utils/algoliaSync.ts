
import { supabase } from '@/integrations/supabase/client';

export const syncPerfumesToAlgolia = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('sync-algolia');
    
    if (error) {
      console.error('Error syncing to Algolia:', error);
      return false;
    }
    
    console.log('Algolia sync result:', data);
    return true;
  } catch (error) {
    console.error('Failed to sync to Algolia:', error);
    return false;
  }
};

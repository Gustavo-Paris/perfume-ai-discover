import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Notification, NotificationStats } from '@/types/notification';
import { toast } from '@/hooks/use-toast';

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Notification[];
    },
  });
};

export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, unread: 0, byType: {} };

      const { data, error } = await supabase
        .from('notifications')
        .select('type, read')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats = data?.reduce((acc, notification) => {
        acc.total++;
        if (!notification.read) acc.unread++;
        acc.byType[notification.type] = (acc.byType[notification.type] || 0) + 1;
        return acc;
      }, { total: 0, unread: 0, byType: {} as { [key: string]: number } } as NotificationStats);

      return stats || { total: 0, unread: 0, byType: {} };
    },
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({
        title: "Notificações marcadas como lidas",
        description: "Todas as notificações foram marcadas como lidas.",
      });
    },
  });
};

export const useAdminNotifications = () => {
  return useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get related data for each notification
      const notificationsWithData: Notification[] = [];
      if (data) {
        for (const notification of data) {
          // Get user data if user_id exists
          let profile = null;
          if (notification.user_id) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', notification.user_id)
              .single();
            profile = profileData;
          }

          notificationsWithData.push({
            ...notification,
            user: profile ? {
              name: profile.name,
              email: profile.email
            } : undefined
          } as Notification);
        }
      }

      return notificationsWithData;
    },
  });
};
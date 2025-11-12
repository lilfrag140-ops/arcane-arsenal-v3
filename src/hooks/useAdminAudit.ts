import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAdminAudit = () => {
  const { toast } = useToast();

  const logAdminAction = async (
    action: string,
    tableName: string,
    recordId?: string,
    details?: Record<string, any>
  ) => {
    try {
      await supabase.rpc('log_sensitive_access', {
        action_type: `admin_${action}`,
        table_name: tableName,
        record_id: recordId,
        details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't show toast to user for audit failures, but still log
    }
  };

  const logOrderView = async (orderId: string, orderDetails: any) => {
    await logAdminAction('view_order', 'orders', orderId, {
      minecraft_username: orderDetails.minecraft_username,
      total_amount: orderDetails.total_amount,
      payment_method: orderDetails.payment_method
    });
  };

  const logOrderStatusUpdate = async (orderId: string, oldStatus: string, newStatus: string) => {
    await logAdminAction('update_order_status', 'orders', orderId, {
      old_status: oldStatus,
      new_status: newStatus
    });
  };

  const logProductManagement = async (action: 'create' | 'update' | 'stock_update', productId?: string, details?: any) => {
    await logAdminAction(`${action}_product`, 'products', productId, details);
  };

  const logTicketManagement = async (action: 'view' | 'reply' | 'status_update', ticketId: string, details?: any) => {
    await logAdminAction(`${action}_ticket`, 'tickets', ticketId, details);
  };

  return {
    logOrderView,
    logOrderStatusUpdate,
    logProductManagement,
    logTicketManagement
  };
};
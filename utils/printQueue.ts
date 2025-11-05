
import { getSupabase } from '@/lib/supabase';
import { PrintQueueItem, PrintQueueItemType } from '@/types';

/**
 * Add an item to the print queue
 */
export async function addToPrintQueue(
  itemType: PrintQueueItemType,
  itemId: string,
  metadata?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PrintQueue] Adding item to queue:', { itemType, itemId, metadata });
    
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('print_queue')
      .insert({
        item_type: itemType,
        item_id: itemId,
        status: 'pending',
        metadata: metadata || null,
      });
    
    if (error) {
      console.error('[PrintQueue] Error adding to queue:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[PrintQueue] Item added to queue successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[PrintQueue] Exception adding to queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all pending print queue items
 */
export async function getPendingPrintQueue(): Promise<PrintQueueItem[]> {
  try {
    console.log('[PrintQueue] Fetching pending items');
    
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('print_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('[PrintQueue] Error fetching pending items:', error);
      return [];
    }
    
    console.log('[PrintQueue] Found', data?.length || 0, 'pending items');
    return data || [];
  } catch (error) {
    console.error('[PrintQueue] Exception fetching pending items:', error);
    return [];
  }
}

/**
 * Mark a print queue item as printed
 */
export async function markAsPrinted(queueItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PrintQueue] Marking item as printed:', queueItemId);
    
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('print_queue')
      .update({
        status: 'printed',
        printed_at: new Date().toISOString(),
      })
      .eq('id', queueItemId);
    
    if (error) {
      console.error('[PrintQueue] Error marking as printed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[PrintQueue] Item marked as printed');
    return { success: true };
  } catch (error: any) {
    console.error('[PrintQueue] Exception marking as printed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a print queue item as failed
 */
export async function markAsFailed(
  queueItemId: string,
  errorMessage: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PrintQueue] Marking item as failed:', queueItemId, errorMessage);
    
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('print_queue')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', queueItemId);
    
    if (error) {
      console.error('[PrintQueue] Error marking as failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[PrintQueue] Item marked as failed');
    return { success: true };
  } catch (error: any) {
    console.error('[PrintQueue] Exception marking as failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a print queue item
 */
export async function deletePrintQueueItem(queueItemId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PrintQueue] Deleting item:', queueItemId);
    
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('print_queue')
      .delete()
      .eq('id', queueItemId);
    
    if (error) {
      console.error('[PrintQueue] Error deleting item:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[PrintQueue] Item deleted');
    return { success: true };
  } catch (error: any) {
    console.error('[PrintQueue] Exception deleting item:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Clear all printed items from the queue
 */
export async function clearPrintedItems(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[PrintQueue] Clearing printed items');
    
    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('print_queue')
      .delete()
      .eq('status', 'printed');
    
    if (error) {
      console.error('[PrintQueue] Error clearing printed items:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[PrintQueue] Printed items cleared');
    return { success: true };
  } catch (error: any) {
    console.error('[PrintQueue] Exception clearing printed items:', error);
    return { success: false, error: error.message };
  }
}


import { supabase } from '@/lib/supabase';

interface ProduceItem {
  id: string;
  name: string;
  category: string;
  variations: string[];
  is_custom: boolean;
}

let cachedProduceItems: ProduceItem[] = [];
let lastCacheUpdate: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load produce dictionary from database
 */
export async function loadProduceDictionary(): Promise<ProduceItem[]> {
  const now = Date.now();
  
  // Return cached items if cache is still valid
  if (cachedProduceItems.length > 0 && now - lastCacheUpdate < CACHE_DURATION) {
    return cachedProduceItems;
  }

  try {
    const { data, error } = await supabase
      .from('produce_dictionary')
      .select('*');

    if (error) {
      console.error('Error loading produce dictionary:', error);
      return cachedProduceItems; // Return old cache on error
    }

    cachedProduceItems = data || [];
    lastCacheUpdate = now;
    
    console.log(`Loaded ${cachedProduceItems.length} produce items from dictionary`);
    return cachedProduceItems;
  } catch (error) {
    console.error('Error loading produce dictionary:', error);
    return cachedProduceItems; // Return old cache on error
  }
}

/**
 * Check if a word or phrase is a known produce item
 */
export function isKnownProduce(text: string, produceItems: ProduceItem[]): boolean {
  if (!text || !text.trim()) return false;
  
  const normalized = text.toLowerCase().trim();
  
  for (const item of produceItems) {
    // Check exact match with name
    if (item.name === normalized) {
      return true;
    }
    
    // Check if text contains the name
    if (normalized.includes(item.name)) {
      return true;
    }
    
    // Check variations
    for (const variation of item.variations) {
      if (variation === normalized || normalized.includes(variation)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Extract produce items from a text
 */
export function extractProduceItems(text: string, produceItems: ProduceItem[]): string[] {
  if (!text || !text.trim()) return [];
  
  const normalized = text.toLowerCase().trim();
  const found: string[] = [];
  
  for (const item of produceItems) {
    // Check exact match with name
    if (normalized.includes(item.name)) {
      found.push(item.name);
      continue;
    }
    
    // Check variations
    for (const variation of item.variations) {
      if (normalized.includes(variation)) {
        found.push(item.name);
        break;
      }
    }
  }
  
  return found;
}

/**
 * Check if a line contains produce-related keywords
 */
export function containsProduceKeywords(line: string, produceItems: ProduceItem[]): boolean {
  if (!line || !line.trim()) return false;
  
  const normalized = line.toLowerCase().trim();
  
  // Check if line contains any produce item
  for (const item of produceItems) {
    if (normalized.includes(item.name)) {
      return true;
    }
    
    for (const variation of item.variations) {
      if (normalized.includes(variation)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get produce item category
 */
export function getProduceCategory(text: string, produceItems: ProduceItem[]): string | null {
  if (!text || !text.trim()) return null;
  
  const normalized = text.toLowerCase().trim();
  
  for (const item of produceItems) {
    if (item.name === normalized || normalized.includes(item.name)) {
      return item.category;
    }
    
    for (const variation of item.variations) {
      if (variation === normalized || normalized.includes(variation)) {
        return item.category;
      }
    }
  }
  
  return null;
}

/**
 * Clear the cache (useful for testing or when dictionary is updated)
 */
export function clearProduceDictionaryCache(): void {
  cachedProduceItems = [];
  lastCacheUpdate = 0;
}


# WhatsApp Customer Name Priority Implementation

## Overview
This document describes the implementation of prioritizing customer names from the database over WhatsApp contact names when processing incoming orders.

## Problem
When a WhatsApp order arrives from a customer whose phone number is registered in the database, the system was using the WhatsApp contact name (e.g., "negrita") instead of the customer's registered name in the database (e.g., "Paulina Araya").

## Solution
Modified the WhatsApp webhook Edge Function to prioritize customer names from the database:

### Changes Made

1. **New Function: `getCustomerNameFromDatabase()`**
   - Queries the `customers` table by phone number
   - Returns the customer's name if found, or `null` if not found
   - Includes error handling for database queries

2. **Updated Function: `extractCustomerName()`**
   - Now accepts `supabase` as the first parameter
   - Changed to an `async` function to support database queries
   - Implements a priority system:
     1. **First Priority**: Customer name from database (if phone number matches)
     2. **Second Priority**: WhatsApp contact name (if no database match)
     3. **Third Priority**: Fallback to "Cliente XXXX" (last 4 digits of phone)

3. **Updated Function Calls**
   - All calls to `extractCustomerName()` now:
     - Pass the `supabase` client as the first parameter
     - Use `await` to handle the async operation
   - Updated in three locations:
     - Blocked customer handling
     - Greeting message handling
     - Order creation

### Code Example

```typescript
/**
 * Get customer name from database by phone number
 */
async function getCustomerNameFromDatabase(supabase: any, phone: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('name')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      return null;
    }

    return data.name;
  } catch (error) {
    console.error('Error getting customer name from database:', error);
    return null;
  }
}

/**
 * Extract customer name from contact or phone
 * Prioritizes database name over WhatsApp contact name
 */
async function extractCustomerName(supabase: any, contact: any, phone: string): Promise<string> {
  // First, try to get name from database
  const dbName = await getCustomerNameFromDatabase(supabase, phone);
  if (dbName) {
    console.log('Using customer name from database:', dbName);
    return dbName;
  }
  
  // Fallback to WhatsApp contact name
  if (contact?.profile?.name) {
    console.log('Using customer name from WhatsApp contact:', contact.profile.name);
    return contact.profile.name;
  }
  
  // Use last 4 digits of phone as fallback
  const fallbackName = `Cliente ${phone.slice(-4)}`;
  console.log('Using fallback customer name:', fallbackName);
  return fallbackName;
}
```

## Behavior

### For Existing Customers
When a WhatsApp order arrives from a phone number that exists in the `customers` table:
- ✅ The customer's name from the database is used
- ✅ The WhatsApp contact name is ignored
- ✅ All orders, notifications, and messages use the database name

### For New Customers
When a WhatsApp order arrives from a phone number that doesn't exist in the `customers` table:
- The WhatsApp contact name is used (if available)
- If no WhatsApp contact name, uses "Cliente XXXX" format

### Example Scenario
**Database**: Customer with phone `+56912345678` is registered as "Paulina Araya"
**WhatsApp**: Same phone number has contact name "negrita"

**Result**: All orders from this phone number will display "Paulina Araya" in:
- Order list
- Order details
- Notifications
- WhatsApp confirmation messages
- Printed receipts

## Logging
The function includes console logging to track which name source is being used:
- `"Using customer name from database: [name]"` - Database name found and used
- `"Using customer name from WhatsApp contact: [name]"` - No database match, using WhatsApp name
- `"Using fallback customer name: [name]"` - No database or WhatsApp name available

## Database Requirements
- The `customers` table must have:
  - `phone` column (text) - Phone number in normalized format (+56XXXXXXXXX)
  - `name` column (text) - Customer's registered name
- Phone numbers must be normalized to the same format in both the webhook and the database

## Edge Function Deployment
The updated Edge Function has been deployed as version 36 of `whatsapp-webhook`.

## Testing
To test this functionality:
1. Ensure a customer exists in the `customers` table with a specific phone number
2. Send a WhatsApp message from that phone number
3. Verify that the order uses the customer name from the database, not the WhatsApp contact name
4. Check the Edge Function logs to confirm which name source was used

## Notes
- This change only affects orders from non-authorized phone numbers (regular customers)
- Authorized phone numbers (in `authorized_phones` table) continue to work as before
- The change is backward compatible - if no database match is found, it falls back to the previous behavior

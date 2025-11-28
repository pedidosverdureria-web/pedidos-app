
# WhatsApp Customer Name Priority Implementation

## Overview
This document describes the implementation of prioritizing customer names from the database over WhatsApp contact names when processing incoming orders.

## Problem
When a WhatsApp order arrives from a customer whose phone number is registered in the database, the system was using the WhatsApp contact name (e.g., "Negrita 💕") instead of the customer's registered name in the database (e.g., "Paulina Araya").

**Root Cause**: Phone number format mismatch between the database and the webhook:
- Database stored phone numbers without the `+` prefix (e.g., `56963200367`)
- Webhook normalized phone numbers with the `+` prefix (e.g., `+56963200367`)
- The exact match query failed to find the customer

## Solution
Modified the WhatsApp webhook Edge Function to handle phone number format inconsistencies by trying multiple lookup strategies:

### Changes Made

1. **Enhanced Function: `getCustomerNameFromDatabase()`**
   - Now tries up to 3 different phone number formats:
     1. Phone number as-is (first attempt)
     2. Without `+` prefix if the original had it
     3. With `+` prefix if the original didn't have it
   - Uses `.maybeSingle()` instead of `.single()` to avoid errors when no match is found
   - Includes detailed logging for each lookup attempt

2. **Updated Function: `extractCustomerName()`**
   - Remains unchanged - still implements the priority system:
     1. **First Priority**: Customer name from database (if phone number matches)
     2. **Second Priority**: WhatsApp contact name (if no database match)
     3. **Third Priority**: Fallback to "Cliente XXXX" (last 4 digits of phone)

### Code Example

```typescript
/**
 * Get customer name from database by phone number
 * This function prioritizes the database name over WhatsApp contact name
 * FIXED: Now tries both with and without the '+' prefix to handle format inconsistencies
 */
async function getCustomerNameFromDatabase(supabase: any, phone: string): Promise<string | null> {
  try {
    console.log(`Looking up customer name in database for phone: ${phone}`);
    
    // Try with the phone number as-is first
    let { data, error } = await supabase
      .from('customers')
      .select('name')
      .eq('phone', phone)
      .maybeSingle();

    // If not found and phone starts with '+', try without the '+'
    if (!data && phone.startsWith('+')) {
      const phoneWithoutPlus = phone.substring(1);
      console.log(`Trying without '+' prefix: ${phoneWithoutPlus}`);
      
      const result = await supabase
        .from('customers')
        .select('name')
        .eq('phone', phoneWithoutPlus)
        .maybeSingle();
      
      data = result.data;
      error = result.error;
    }
    
    // If not found and phone doesn't start with '+', try with '+'
    if (!data && !phone.startsWith('+')) {
      const phoneWithPlus = '+' + phone;
      console.log(`Trying with '+' prefix: ${phoneWithPlus}`);
      
      const result = await supabase
        .from('customers')
        .select('name')
        .eq('phone', phoneWithPlus)
        .maybeSingle();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.log('Customer not found in database or error occurred:', error.message);
      return null;
    }

    if (data && data.name) {
      console.log(`✅ Found customer in database: "${data.name}" (replacing WhatsApp contact name)`);
      return data.name;
    }

    console.log('Customer not found in database');
    return null;
  } catch (error) {
    console.error('Error getting customer name from database:', error);
    return null;
  }
}
```

## Behavior

### For Existing Customers
When a WhatsApp order arrives from a phone number that exists in the `customers` table:
- ✅ The customer's name from the database is used (regardless of phone format)
- ✅ The WhatsApp contact name is ignored
- ✅ All orders, notifications, and messages use the database name
- ✅ Works with phone numbers stored with or without the `+` prefix

### For New Customers
When a WhatsApp order arrives from a phone number that doesn't exist in the `customers` table:
- The WhatsApp contact name is used (if available)
- If no WhatsApp contact name, uses "Cliente XXXX" format

### Example Scenario
**Database**: Customer with phone `56963200367` (no `+`) is registered as "Paulina Araya"
**WhatsApp**: Message arrives from `+56963200367` (with `+`) with contact name "Negrita 💕"

**Result**: All orders from this phone number will display "Paulina Araya" in:
- Order list
- Order details
- Notifications
- WhatsApp confirmation messages
- Printed receipts

## Logging
The function includes detailed console logging to track the lookup process:
- `"Looking up customer name in database for phone: [phone]"` - Initial lookup attempt
- `"Trying without '+' prefix: [phone]"` - Second attempt without `+`
- `"Trying with '+' prefix: [phone]"` - Third attempt with `+`
- `"✅ Found customer in database: [name]"` - Database name found and used
- `"📱 Using customer name from WhatsApp contact: [name]"` - No database match, using WhatsApp name
- `"⚠️ Using fallback customer name: [name]"` - No database or WhatsApp name available

## Database Requirements
- The `customers` table must have:
  - `phone` column (text) - Phone number (can be with or without `+` prefix)
  - `name` column (text) - Customer's registered name
- Phone numbers can be stored in any of these formats:
  - `56963200367` (without `+`)
  - `+56963200367` (with `+`)
  - The lookup will work regardless of format

## Edge Function Deployment
The updated Edge Function has been deployed as **version 62** of `whatsapp-webhook`.

## Testing
To test this functionality:
1. Ensure a customer exists in the `customers` table with a specific phone number (with or without `+`)
2. Send a WhatsApp message from that phone number
3. Verify that the order uses the customer name from the database, not the WhatsApp contact name
4. Check the Edge Function logs to confirm which name source was used and which lookup attempts were made

## Notes
- This change only affects orders from non-authorized phone numbers (regular customers)
- Authorized phone numbers (in `authorized_phones` table) continue to work as before
- The change is backward compatible - works with both old and new phone number formats
- No database migration is required - existing phone numbers work as-is

## Fix Summary
**Issue**: Order 20251128-000306 showed "Negrita 💕" instead of "Paulina Araya"
**Cause**: Phone format mismatch (database: `56963200367`, webhook: `+56963200367`)
**Solution**: Enhanced lookup to try multiple phone formats
**Status**: ✅ Fixed and deployed (version 62)

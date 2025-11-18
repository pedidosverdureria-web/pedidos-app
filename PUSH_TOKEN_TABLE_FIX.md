
# Push Token Table Population Fix

## Problem
The `device_push_tokens` table was not being populated when users logged in, preventing push notifications from working. The table remained empty despite the app attempting to register push tokens.

## Root Cause
The issue was in the `registerForPushNotificationsAsync` function in `utils/pushNotifications.ts`. The function was using a "check-then-update-or-insert" pattern:

1. First, it queried for an existing record with `.single()`
2. If found, it would UPDATE the record
3. If not found, it would INSERT a new record

However, when no record existed, the code was executing a PATCH (update) request, which returned a 204 (No Content) status but didn't actually create any rows in the database.

## Solution
Replaced the "check-then-update-or-insert" logic with a single `upsert` operation:

```typescript
const { data, error } = await supabase
  .from('device_push_tokens')
  .upsert({
    device_id: deviceId,
    push_token: token,
    user_role: userRole || null,
    device_name: deviceName,
    last_active_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, {
    onConflict: 'device_id', // Use device_id as the conflict resolution column
    ignoreDuplicates: false, // Always update if exists
  })
  .select();
```

## How Upsert Works
The `upsert` operation is atomic and more reliable:

1. It attempts to INSERT the record
2. If a conflict occurs on the `device_id` column (because a record with that device_id already exists), it UPDATEs the existing record instead
3. This is a single database operation, avoiding race conditions

## Database Structure
The `device_push_tokens` table has:
- A unique constraint on `device_id` (`device_push_tokens_device_id_key`)
- RLS policy that allows all operations for public access
- Columns: `id`, `device_id`, `push_token`, `user_role`, `device_name`, `last_active_at`, `created_at`, `updated_at`

## Testing
After this fix:
1. Users logging in with any PIN (admin: 5050, worker: 5030, printer: 5010, desarrollador: 9032) will have their device registered
2. The `device_push_tokens` table will be populated with device information
3. Push notifications will be sent to all registered devices when new orders arrive
4. Each device gets a unique `device_id` stored in AsyncStorage for persistence

## Additional Improvements
- Added detailed logging to track the registration process
- Added error logging with full error details for debugging
- The function now logs the device ID, device name, and user role being saved

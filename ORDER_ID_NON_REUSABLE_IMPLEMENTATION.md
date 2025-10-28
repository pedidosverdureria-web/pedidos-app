
# Order ID Non-Reusable Implementation

## Overview

This document describes the implementation of unique, non-reusable order IDs in the order management system. Order IDs are now guaranteed to never be reused, even after an order is deleted.

## Problem Statement

Previously, the order number generation system used a counter based on the number of existing orders for each day. This meant that if an order was deleted, its number could potentially be reused for a new order created on the same day.

**Old Implementation:**
```sql
-- Count orders created today
select count(*) + 1 into counter
from orders
where order_number like new_number || '%';
```

This approach had the following issues:
- **Reusable IDs**: Deleted order numbers could be reused
- **Race Conditions**: Multiple simultaneous inserts could generate duplicate numbers
- **Audit Trail**: No way to track that an order number was previously used

## Solution

The new implementation uses a PostgreSQL sequence to generate order numbers. Sequences are guaranteed to:
- Never reuse values, even after deletion
- Handle concurrent inserts safely
- Maintain a continuous audit trail

### Implementation Details

#### 1. Order Number Sequence

A dedicated sequence was created for order numbers:

```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1;
```

**Key Properties:**
- Never resets or reuses values
- Thread-safe and handles concurrent access
- Persists across database restarts
- Survives order deletions

#### 2. Updated Order Number Generation Function

The `generate_order_number()` function was updated to use the sequence:

```sql
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  seq_value bigint;
BEGIN
  -- Get next value from sequence (this never reuses values)
  seq_value := nextval('order_number_seq');
  
  -- Format: YYYYMMDD-NNNNNN (date + 6-digit sequence number)
  new_number := to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_value::text, 6, '0');
  
  -- Ensure uniqueness (in case of race conditions or manual insertions)
  WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) LOOP
    seq_value := nextval('order_number_seq');
    new_number := to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_value::text, 6, '0');
  END LOOP;
  
  RETURN new_number;
END;
$$;
```

**Features:**
- Uses `nextval()` to get the next sequence value
- Format: `YYYYMMDD-NNNNNN` (e.g., `20251028-000015`)
- Includes date prefix for human readability
- 6-digit sequence number (supports up to 999,999 orders)
- Additional uniqueness check as a safety measure

#### 3. Sequence Initialization

The sequence was initialized to start after the highest existing order number:

```sql
DO $$
DECLARE
  max_seq_from_orders bigint;
BEGIN
  -- Extract the highest sequence number from existing order_numbers
  SELECT COALESCE(MAX(
    CASE 
      WHEN order_number ~ '^\d{8}-\d+$' 
      THEN CAST(split_part(order_number, '-', 2) AS bigint)
      ELSE 0
    END
  ), 0) INTO max_seq_from_orders
  FROM orders;
  
  -- Set sequence to start after the highest existing number
  PERFORM setval('order_number_seq', GREATEST(max_seq_from_orders, 1), true);
END;
$$;
```

This ensures:
- No conflicts with existing order numbers
- Smooth transition from old to new system
- Continuity in order numbering

## Order Number Format

### New Format
- **Pattern**: `YYYYMMDD-NNNNNN`
- **Example**: `20251028-000015`
- **Components**:
  - `YYYYMMDD`: Date in ISO format (8 digits)
  - `-`: Separator
  - `NNNNNN`: 6-digit sequence number with leading zeros

### Old Format (for reference)
- **Pattern**: `YYYYMMDD-NNNN`
- **Example**: `20251028-0010`
- **Components**:
  - `YYYYMMDD`: Date in ISO format (8 digits)
  - `-`: Separator
  - `NNNN`: 4-digit counter with leading zeros

## Benefits

### 1. Guaranteed Uniqueness
- Order numbers are never reused, even after deletion
- Sequence values are never rolled back
- Safe for concurrent operations

### 2. Audit Trail
- Complete history of all order numbers ever generated
- Can track gaps in sequence to identify deleted orders
- Forensic analysis capabilities

### 3. Scalability
- 6-digit sequence supports up to 999,999 orders
- Can be easily extended if needed
- No performance degradation with large datasets

### 4. Data Integrity
- No race conditions
- No duplicate order numbers
- Consistent behavior across all scenarios

## Testing

### Verify Sequence Status
```sql
-- Check current sequence value
SELECT last_value 
FROM pg_sequences 
WHERE sequencename = 'order_number_seq';
```

### Test Order Number Generation
```sql
-- Generate a test order number
SELECT generate_order_number() AS test_order_number;
```

### Verify Non-Reusability
```sql
-- Create a test order
INSERT INTO orders (customer_name, status, source)
VALUES ('Test Customer', 'pending', 'manual')
RETURNING id, order_number;

-- Note the order_number (e.g., 20251028-000015)

-- Delete the order
DELETE FROM orders WHERE order_number = '20251028-000015';

-- Create another order - it will get a NEW number (e.g., 20251028-000016)
INSERT INTO orders (customer_name, status, source)
VALUES ('Test Customer 2', 'pending', 'manual')
RETURNING id, order_number;

-- The deleted number (000015) will NEVER be reused
```

## Migration Details

**Migration Name**: `ensure_unique_non_reusable_order_numbers`

**Applied**: 2025-10-28

**Changes**:
1. Created `order_number_seq` sequence
2. Updated `generate_order_number()` function
3. Initialized sequence from existing orders
4. Added documentation comments

## Backward Compatibility

The new system is fully backward compatible:
- Existing orders retain their original order numbers
- Old format (4-digit) and new format (6-digit) coexist
- No data migration required
- All existing functionality continues to work

## Future Considerations

### Sequence Exhaustion
If the 6-digit sequence (999,999) is exhausted:
1. The date prefix will change daily, resetting the sequence context
2. Can extend to 7 or 8 digits if needed
3. Can implement date-based sequence partitioning

### Performance
- Sequence operations are extremely fast (microseconds)
- No table scans required
- Minimal overhead compared to old counting method

### Monitoring
Monitor sequence usage:
```sql
-- Check sequence progress
SELECT 
  last_value,
  CASE 
    WHEN last_value < 100000 THEN 'Low'
    WHEN last_value < 500000 THEN 'Medium'
    WHEN last_value < 900000 THEN 'High'
    ELSE 'Critical'
  END AS usage_level
FROM pg_sequences 
WHERE sequencename = 'order_number_seq';
```

## Conclusion

The order ID system now guarantees that order numbers are unique and non-reusable, providing better data integrity, audit capabilities, and compliance with the requirement that deleted order IDs should never be reused.

All new orders will automatically use the new sequence-based system, ensuring consistent and reliable order number generation across the entire application.

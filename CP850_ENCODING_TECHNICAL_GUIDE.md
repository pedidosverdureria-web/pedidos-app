
# CP850 Encoding - Technical Implementation Guide

## Overview

This document provides technical details about the CP850 (Code Page 850) encoding implementation for thermal printer support in the order management application.

## What is CP850?

**CP850** (Code Page 850), also known as **DOS Latin 1** or **Multilingual Latin 1**, is a character encoding used primarily in Western Europe. It's the standard encoding for thermal printers that need to print Spanish and other Western European languages.

### Key Features

- **8-bit encoding:** Each character is represented by a single byte (0-255)
- **ASCII compatible:** Characters 0-127 are identical to ASCII
- **Extended characters:** Characters 128-255 include accented letters, special symbols, and box-drawing characters
- **Thermal printer standard:** Most ESC/POS thermal printers support CP850 natively

## Why CP850 for Spanish?

Spanish requires several special characters that are not in standard ASCII:

1. **ñ, Ñ** - The most critical character for Spanish
2. **á, é, í, ó, ú** - Lowercase vowels with acute accent
3. **Á, É, Í, Ó, Ú** - Uppercase vowels with acute accent
4. **ü, Ü** - U with dieresis
5. **¿, ¡** - Inverted question mark and exclamation mark

CP850 includes all these characters in its extended character set (128-255).

## Implementation Details

### Character Mapping

The implementation uses a comprehensive character map that converts Unicode characters to their CP850 byte values:

```typescript
const CP850_MAP: { [key: string]: number } = {
  // Spanish critical characters
  'ñ': 164,  // LATIN SMALL LETTER N WITH TILDE
  'Ñ': 165,  // LATIN CAPITAL LETTER N WITH TILDE
  
  // Lowercase accented vowels
  'á': 160,  // LATIN SMALL LETTER A WITH ACUTE
  'é': 130,  // LATIN SMALL LETTER E WITH ACUTE
  'í': 161,  // LATIN SMALL LETTER I WITH ACUTE
  'ó': 162,  // LATIN SMALL LETTER O WITH ACUTE
  'ú': 163,  // LATIN SMALL LETTER U WITH ACUTE
  
  // Uppercase accented vowels
  'Á': 181,  // LATIN CAPITAL LETTER A WITH ACUTE
  'É': 144,  // LATIN CAPITAL LETTER E WITH ACUTE
  'Í': 214,  // LATIN CAPITAL LETTER I WITH ACUTE
  'Ó': 224,  // LATIN CAPITAL LETTER O WITH ACUTE
  'Ú': 233,  // LATIN CAPITAL LETTER U WITH ACUTE
  
  // Other Spanish characters
  'ü': 129,  // LATIN SMALL LETTER U WITH DIAERESIS
  'Ü': 154,  // LATIN CAPITAL LETTER U WITH DIAERESIS
  '¿': 168,  // INVERTED QUESTION MARK
  '¡': 173,  // INVERTED EXCLAMATION MARK
  
  // ... (100+ more characters)
};
```

### Conversion Algorithm

The conversion from Unicode text to CP850 bytes follows this algorithm:

```typescript
function convertToCP850(text: string): Uint8Array {
  const bytes: number[] = [];
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);
    
    // Check if character has a CP850 mapping
    if (CP850_MAP[char] !== undefined) {
      bytes.push(CP850_MAP[char]);
    } 
    // ASCII characters (0-127) can be used directly
    else if (charCode < 128) {
      bytes.push(charCode);
    }
    // For unmapped characters, use space as fallback
    else {
      bytes.push(32); // Space character
    }
  }
  
  return new Uint8Array(bytes);
}
```

### Printer Initialization

Before printing, the printer must be set to CP850 mode using ESC/POS commands:

```typescript
// ESC @ - Initialize printer
const INIT = '\x1B\x40';

// ESC t 2 - Set code page to CP850
const SET_CODEPAGE_850 = '\x1B\x74\x02';

// Send initialization commands
const initCommands = [
  0x1B, 0x40,  // ESC @
  0x1B, 0x74, 0x02,  // ESC t 2
];
```

**Critical:** The `ESC t 2` command MUST be sent as raw bytes (0x1B 0x74 0x02), not as a string, to ensure the printer interprets it correctly.

## Character Set Coverage

### Spanish Characters (100% Coverage)

| Character | Unicode | CP850 | Description |
|-----------|---------|-------|-------------|
| ñ | U+00F1 | 164 | Latin Small Letter N with Tilde |
| Ñ | U+00D1 | 165 | Latin Capital Letter N with Tilde |
| á | U+00E1 | 160 | Latin Small Letter A with Acute |
| é | U+00E9 | 130 | Latin Small Letter E with Acute |
| í | U+00ED | 161 | Latin Small Letter I with Acute |
| ó | U+00F3 | 162 | Latin Small Letter O with Acute |
| ú | U+00FA | 163 | Latin Small Letter U with Acute |
| Á | U+00C1 | 181 | Latin Capital Letter A with Acute |
| É | U+00C9 | 144 | Latin Capital Letter E with Acute |
| Í | U+00CD | 214 | Latin Capital Letter I with Acute |
| Ó | U+00D3 | 224 | Latin Capital Letter O with Acute |
| Ú | U+00DA | 233 | Latin Capital Letter U with Acute |
| ü | U+00FC | 129 | Latin Small Letter U with Diaeresis |
| Ü | U+00DC | 154 | Latin Capital Letter U with Diaeresis |
| ¿ | U+00BF | 168 | Inverted Question Mark |
| ¡ | U+00A1 | 173 | Inverted Exclamation Mark |

### Additional Characters

- **French:** à, è, ì, ò, ù, â, ê, î, ô, û, ç, Ç
- **German:** ä, ö, ü, Ä, Ö, Ü, ß
- **Portuguese:** ã, õ, Ã, Õ
- **Nordic:** å, Å, æ, Æ, ø, Ø
- **Symbols:** °, €, £, ¥, ¢, ±, ×, ÷
- **Box Drawing:** ─, │, ┌, ┐, └, ┘, ═, ║, ╔, ╗, ╚, ╝

## Helper Variables

To make it easier to use Spanish words in code, we provide pre-defined constants:

### SPANISH_WORDS

```typescript
export const SPANISH_WORDS = {
  // Words with Ñ
  ANIO: 'Año',
  NINO: 'Niño',
  SENOR: 'Señor',
  MANANA: 'Mañana',
  ESPANA: 'España',
  
  // Words with accents
  TELEFONO: 'Teléfono',
  DIRECCION: 'Dirección',
  ATENCION: 'Atención',
  
  // Receipt words
  PEDIDO: 'Pedido',
  CLIENTE: 'Cliente',
  TOTAL: 'Total',
  // ... (100+ more words)
};
```

### SPANISH_PHRASES

```typescript
export const SPANISH_PHRASES = {
  GRACIAS_POR_SU_COMPRA: 'Gracias por su compra!',
  VUELVA_PRONTO: 'Vuelva pronto!',
  ATENCION_AL_CLIENTE: 'Atención al cliente',
  // ... (40+ more phrases)
};
```

## Usage Examples

### Basic Usage

```typescript
import { SPANISH_WORDS } from '@/utils/receiptGenerator';

// Instead of:
const text = "Teléfono: " + phone;

// Use:
const text = `${SPANISH_WORDS.TELEFONO}: ${phone}`;
```

### Receipt Generation

```typescript
import { generateReceiptText } from '@/utils/receiptGenerator';

const config = {
  encoding: 'CP850',
  paper_size: '80mm',
  include_logo: true,
  include_customer_info: true,
  include_totals: true,
};

const receiptText = generateReceiptText(order, config);
```

### Printing

```typescript
import { usePrinter } from '@/hooks/usePrinter';

const { printReceipt } = usePrinter();

await printReceipt(
  receiptText,
  true,      // autoCut
  'medium',  // textSize
  'CP850'    // encoding
);
```

## Testing

### Test Print Function

The `testPrint()` function includes comprehensive character testing:

```typescript
const testContent = `
CARACTERES ESPECIALES ESPAÑOLES:

Vocales con acento:
á é í ó ú
Á É Í Ó Ú

La letra Ñ:
ñ Ñ

PALABRAS COMUNES:
- Año (no "Ano")
- Niño (no "Nino")
- Señor (no "Senor")
- Mañana (no "Manana")
- España (no "Espana")
`;
```

### Verification Checklist

✅ **ñ and Ñ print correctly** (most important)
✅ **Accented vowels print correctly** (á, é, í, ó, ú)
✅ **Uppercase accented vowels print correctly** (Á, É, Í, Ó, Ú)
✅ **Inverted punctuation prints correctly** (¿, ¡)
✅ **No blank spaces where special characters should be**
✅ **Words like "Año" don't print as "A o" or "Ano"**

## Troubleshooting

### Problem: Blank spaces instead of ñ

**Cause:** Printer not set to CP850 mode

**Solution:**
1. Ensure `ESC t 2` command is sent before printing
2. Send command as raw bytes: `[0x1B, 0x74, 0x02]`
3. Verify printer supports CP850

### Problem: Wrong characters printed

**Cause:** Incorrect character mapping or encoding mismatch

**Solution:**
1. Verify CP850_MAP has correct values
2. Check printer's actual code page setting
3. Try alternative encodings (ISO-8859-1, Windows-1252)

### Problem: Some characters work, others don't

**Cause:** Incomplete character map or printer limitations

**Solution:**
1. Check if character is in CP850_MAP
2. Add missing characters to map
3. Use fallback character (space) for unsupported chars

## Performance Considerations

### Memory Usage

- Character map: ~2KB in memory
- Conversion buffer: Proportional to text length
- Typical receipt: 500-2000 bytes

### Speed

- Conversion: O(n) where n is text length
- Typical receipt: <1ms conversion time
- Printing: Limited by Bluetooth and printer speed

### Optimization

```typescript
// Chunk data to avoid buffer overflow
const MAX_CHUNK_SIZE = 180; // bytes per write

for (let i = 0; i < data.length; i += MAX_CHUNK_SIZE) {
  const chunk = data.slice(i, i + MAX_CHUNK_SIZE);
  await sendChunk(chunk);
  await delay(50); // Small delay between chunks
}
```

## Compatibility

### Supported Printers

- ✅ Generic 58mm thermal printers
- ✅ Generic 80mm thermal printers
- ✅ ESC/POS compatible printers
- ✅ Most Bluetooth thermal printers

### Tested Encodings

1. **CP850** (Recommended) - Full Spanish support
2. **ISO-8859-1** - Good Spanish support
3. **Windows-1252** - Similar to ISO-8859-1
4. **UTF-8** - Limited printer support

## Best Practices

1. **Always use CP850 for Spanish**
   ```typescript
   const config = { encoding: 'CP850' };
   ```

2. **Use helper variables**
   ```typescript
   import { SPANISH_WORDS } from '@/utils/receiptGenerator';
   text += SPANISH_WORDS.TELEFONO;
   ```

3. **Test before production**
   ```typescript
   await testPrint(true, 'CP850');
   ```

4. **Handle errors gracefully**
   ```typescript
   try {
     await printReceipt(text, true, 'medium', 'CP850');
   } catch (error) {
     console.error('Print error:', error);
     // Fallback or retry logic
   }
   ```

5. **Log conversion details**
   ```typescript
   console.log('Converting to CP850:', text.length, 'chars');
   const bytes = convertToCP850(text);
   console.log('Converted to:', bytes.length, 'bytes');
   ```

## References

- **CP850 Specification:** [Wikipedia - Code Page 850](https://en.wikipedia.org/wiki/Code_page_850)
- **ESC/POS Commands:** [ESC/POS Command Reference](https://reference.epson-biz.com/modules/ref_escpos/)
- **Unicode to CP850:** [Unicode Consortium](https://www.unicode.org/)
- **Thermal Printing:** [Thermal Printer Programming Guide](https://www.sparkfun.com/datasheets/Components/General/Driver%20board.pdf)

## Appendix: Complete CP850 Character Map

See `hooks/usePrinter.ts` for the complete character map with 100+ characters including:

- All Spanish characters
- French, German, Portuguese, Nordic characters
- Currency symbols (€, £, ¥, ¢)
- Mathematical symbols (±, ×, ÷, ², ³)
- Box drawing characters
- Special punctuation

---

**Document Version:** 1.0.0
**Last Updated:** 2024
**Status:** ✅ Production Ready

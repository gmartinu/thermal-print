# Troubleshooting Cut Commands

## Confirmed: Cut command IS in buffer

Your buffer shows: `1d 56 42 03` at the end ✅

This is the correct ESC/POS partial cut with feed command (GS V 66 3).

## Problem: Printer not responding to cut command

### Possible causes:

1. **Printer doesn't support GS V 66 variant**
   - Some printers only support basic `GS V 0` or `GS V 1`
   - Try the cut test to find which command works

2. **Printer needs different baud rate**
   - Current: 115200
   - Try: 9600, 19200, 38400

3. **Printer requires specific initialization**
   - Some printers need to be initialized first
   - Try sending `ESC @` before cutting

4. **Cut mechanism disabled in printer settings**
   - Check printer DIP switches
   - Check printer configuration mode

5. **Printer model doesn't have auto-cutter**
   - Some thermal printers don't have cutting mechanism
   - Need manual tear-off

## Quick Tests

### Test 1: Run automated cut test
```bash
npm run test:escpos:cut -- --port COM4
```

This will try 7 different cut commands automatically.

### Test 2: Try basic cut (no feed)
Edit `test-direct.ts` line 550:
```typescript
// Change from:
generator.cutPartialWithFeed(3);

// To:
generator.printer.raw(Buffer.from([0x1d, 0x56, 0x01])); // Basic partial cut
```

### Test 3: Try full cut instead of partial
```typescript
generator.printer.raw(Buffer.from([0x1d, 0x56, 0x00])); // Full cut
```

### Test 4: Try alternative ESC i command
```typescript
generator.printer.raw(Buffer.from([0x1b, 0x69])); // ESC i
```

### Test 5: Use high-level escpos cut method
```typescript
generator.printer.cut(); // Let escpos library handle it
```

### Test 6: Try more feed before cut
```typescript
generator.addLineFeed(10); // Feed 10 lines
generator.printer.raw(Buffer.from([0x1d, 0x56, 0x01]));
```

## Common ESC/POS Cut Commands

| Command | Hex | Description | Support |
|---------|-----|-------------|---------|
| GS V 0 | `1D 56 00` | Full cut | Most printers ✅ |
| GS V 1 | `1D 56 01` | Partial cut | Most printers ✅ |
| GS V 65 n | `1D 56 41 n` | Full cut + feed | Many printers |
| GS V 66 n | `1D 56 42 n` | Partial cut + feed | Many printers |
| ESC i | `1B 69` | Cut paper | Some models |
| ESC m | `1B 6D` | Partial cut | Some models |

## Printer-Specific Commands

### Epson TM-T20
```
1D 56 00  // Full cut
1D 56 01  // Partial cut
```

### Star TSP100
```
1B 64 n  // Cut and feed n lines
```

### Citizen CT-S310II
```
1D 56 00  // Full cut
1D 56 01  // Partial cut
```

### Bematech MP-4200 TH
```
Should support: 1D 56 00 and 1D 56 01
May need: ESC @ initialization first
```

## Debug Steps

### 1. Check if cut command is in buffer
```bash
npm run test:escpos:direct -- --print
```
Look for output showing last 30 bytes should contain `1d 56 XX XX`

### 2. Verify serial communication
- Check baudRate (try 9600 instead of 115200)
- Check data bits, parity, stop bits
- Verify COM port number

### 3. Test with different port settings
Edit `test-direct.ts` line 24:
```typescript
const port = new SerialPort({
  path: portPath,
  baudRate: 9600, // Try 9600 instead of 115200
  dataBits: 8,
  parity: "none",
  stopBits: 1,
  rtscts: false, // Try true if false doesn't work
});
```

### 4. Check printer manual
Look for:
- "Paper cut command"
- "Auto cutter"
- "ESC/POS command set"
- Supported commands list

## Solution: Update generator.ts

Once you find which command works, update the cut methods:

```typescript
// In generator.ts, update cutPartialWithFeed:
cutPartialWithFeed(lines = 3): void {
  const feedLines = Math.max(1, Math.min(255, lines));

  // Try one of these based on test results:
  this.printer.raw(Buffer.from([0x1d, 0x56, 0x01])); // Basic partial
  // OR
  this.printer.raw(Buffer.from([0x1d, 0x56, 0x00])); // Basic full
  // OR
  this.printer.raw(Buffer.from([0x1b, 0x69])); // ESC i
  // OR
  this.printer.cut(); // High-level API
}
```

## Report Your Findings

Please report which command worked:
1. Run: `npm run test:escpos:cut -- --port COM4`
2. Note which test number cut the paper
3. We'll update the library to use that command

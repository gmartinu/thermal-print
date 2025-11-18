import React from 'react';
import { convertToESCPOS } from '../src/index';
import { Text, View, Document, Page } from '@react-pdf/renderer';
import * as fs from 'fs';
import { SerialPort } from 'serialport';

/**
 * Test component showcasing all font size mappings
 *
 * Font size mapping (using ESC ! command, max 2x2):
 * - 8-12px  → 1x1 (normal)
 * - 13-18px → 1x2 (normal width, double height)
 * - 19-24px → 2x1 (double width, normal height)
 * - 25+px   → 2x2 (double width, double height - maximum)
 */
const FontSizeTestReceipt = () => (
  <Document>
    <Page style={{ padding: 10 }}>
      <View>
        <Text style={{ fontSize: 10, textAlign: 'center' }}>
          Font Size Test Receipt
        </Text>
        <Text style={{ fontSize: 8, textAlign: 'center' }}>
          Testing all size mappings
        </Text>

        <View style={{ marginTop: 10, borderTop: '1px solid black' }} />

        {/* 1x1 - Normal (8-12px) */}
        <Text style={{ fontSize: 8, marginTop: 5 }}>
          8px - Size 1x1 (Smallest)
        </Text>
        <Text style={{ fontSize: 10 }}>
          10px - Size 1x1 (Normal)
        </Text>
        <Text style={{ fontSize: 12 }}>
          12px - Size 1x1 (Upper bound)
        </Text>

        <View style={{ marginTop: 5, borderTop: '1px dashed black' }} />

        {/* 1x2 - Normal width, double height (13-18px) */}
        <Text style={{ fontSize: 13, marginTop: 5 }}>
          13px - Size 1x2
        </Text>
        <Text style={{ fontSize: 16 }}>
          16px - Size 1x2 (Mid)
        </Text>
        <Text style={{ fontSize: 18 }}>
          18px - Size 1x2 (Upper)
        </Text>

        <View style={{ marginTop: 5, borderTop: '1px dashed black' }} />

        {/* 2x1 - Double width, normal height (19-24px) */}
        <Text style={{ fontSize: 19, marginTop: 5 }}>
          19px - Size 2x1
        </Text>
        <Text style={{ fontSize: 22 }}>
          22px - 2x1 (Mid)
        </Text>
        <Text style={{ fontSize: 24 }}>
          24px - 2x1 (Max)
        </Text>

        <View style={{ marginTop: 5, borderTop: '1px dashed black' }} />

        {/* 2x2 - Double width and height (25+px) - Maximum */}
        <Text style={{ fontSize: 25, marginTop: 5 }}>
          25px - 2x2 (Max)
        </Text>
        <Text style={{ fontSize: 30 }}>
          30px - 2x2 (Max)
        </Text>
        <Text style={{ fontSize: 40 }}>
          40px - 2x2 (Max)
        </Text>
        <Text style={{ fontSize: 60 }}>
          60px - 2x2 (Max)
        </Text>

        <View style={{ marginTop: 10, borderTop: '1px solid black' }} />

        <Text style={{ fontSize: 10, textAlign: 'center', marginTop: 5 }}>
          End of Font Size Test
        </Text>
      </View>
    </Page>
  </Document>
);

/**
 * Helper function to decode ESC/POS commands for debugging
 */
function decodeESCPOSCommands(buffer: Buffer): string[] {
  const commands: string[] = [];
  let i = 0;

  while (i < buffer.length) {
    const byte = buffer[i];

    // ESC commands
    if (byte === 0x1B && i + 1 < buffer.length) {
      const cmd = buffer[i + 1];

      if (cmd === 0x40) {
        commands.push('ESC @ (Initialize printer)');
        i += 2;
      } else if (cmd === 0x61 && i + 2 < buffer.length) {
        const align = buffer[i + 2];
        const alignText = align === 0 ? 'LEFT' : align === 1 ? 'CENTER' : 'RIGHT';
        commands.push(`ESC a ${align} (Align ${alignText})`);
        i += 3;
      } else if (cmd === 0x45 && i + 2 < buffer.length) {
        const bold = buffer[i + 2];
        commands.push(`ESC E ${bold} (Bold ${bold ? 'ON' : 'OFF'})`);
        i += 3;
      } else if (cmd === 0x33 && i + 2 < buffer.length) {
        const spacing = buffer[i + 2];
        commands.push(`ESC 3 ${spacing} (Line spacing: ${spacing} dots)`);
        i += 3;
      } else {
        commands.push(`ESC 0x${cmd.toString(16).toUpperCase()}`);
        i += 2;
      }
    }
    // GS commands (including character size)
    else if (byte === 0x1D && i + 1 < buffer.length) {
      const cmd = buffer[i + 1];

      if (cmd === 0x21 && i + 2 < buffer.length) {
        const size = buffer[i + 2];
        const width = (size & 0x0F) + 1;
        const height = ((size >> 4) & 0x0F) + 1;
        commands.push(`GS ! 0x${size.toString(16).toUpperCase().padStart(2, '0')} (Size ${width}x${height})`);
        i += 3;
      } else {
        commands.push(`GS 0x${cmd.toString(16).toUpperCase()}`);
        i += 2;
      }
    }
    // Line feed
    else if (byte === 0x0A) {
      commands.push('LF (Line feed)');
      i++;
    }
    // Printable text
    else if (byte >= 0x20 && byte <= 0x7E) {
      let text = '';
      while (i < buffer.length && buffer[i] >= 0x20 && buffer[i] <= 0x7E) {
        text += String.fromCharCode(buffer[i]);
        i++;
      }
      commands.push(`TEXT: "${text}"`);
    }
    // Other bytes
    else {
      commands.push(`0x${byte.toString(16).toUpperCase()}`);
      i++;
    }
  }

  return commands;
}

/**
 * Print buffer to serial port (COM port)
 */
async function printToSerial(buffer: Buffer, portName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n🖨️  Connecting to printer on ${portName}...`);

    const port = new SerialPort({
      path: portName,
      baudRate: 9600,
      dataBits: 8,
      stopBits: 1,
      parity: 'none'
    });

    port.on('open', () => {
      console.log(`✅ Connected to ${portName}`);
      console.log(`📤 Sending ${buffer.length} bytes to printer...`);

      port.write(buffer, (err) => {
        if (err) {
          console.error('❌ Error writing to port:', err);
          port.close();
          reject(err);
        } else {
          console.log('✅ Data sent successfully');

          // Wait for data to be transmitted before closing
          port.drain((drainErr) => {
            if (drainErr) {
              console.error('❌ Error draining port:', drainErr);
            }
            port.close();
            resolve();
          });
        }
      });
    });

    port.on('error', (err) => {
      console.error(`❌ Serial port error:`, err);
      reject(err);
    });

    port.on('close', () => {
      console.log(`🔌 Disconnected from ${portName}\n`);
    });
  });
}

/**
 * Run the font size test
 */
async function runFontSizeTest() {
  console.log('🧪 Running Font Size Test...\n');

  // Check for command line arguments
  const args = process.argv.slice(2);
  const shouldPrint = args.includes('--print');
  const portArg = args.find(arg => arg.startsWith('--port='));
  const portName = portArg ? portArg.split('=')[1] : 'COM4';
  const adapterArg = args.find(arg => arg.startsWith('--adapter='));
  const adapterType = adapterArg ? adapterArg.split('=')[1] : 'escpos';

  // Validate adapter type
  const commandAdapter = (adapterType === 'escbematech' || adapterType === 'escpos')
    ? adapterType
    : 'escpos';

  console.log(`Command Adapter: ${commandAdapter.toUpperCase()}`);

  try {
    // Generate ESC/POS buffer
    const buffer = await convertToESCPOS(<FontSizeTestReceipt />, {
      paperWidth: 48,
      encoding: 'cp860',
      cut: shouldPrint ? 'partial' : false, // Only cut if printing
      debug: true,
      commandAdapter: commandAdapter as 'escpos' | 'escbematech',
    });

    console.log('✅ ESC/POS buffer generated successfully');
    console.log(`📊 Buffer size: ${buffer.length} bytes\n`);

    // Save raw buffer to file
    const binPath = './test/font-size-test.bin';
    fs.writeFileSync(binPath, buffer);
    console.log(`💾 Raw binary saved to: ${binPath}`);
    console.log('   You can send this to a thermal printer for testing\n');

    // Decode and display commands
    console.log('📋 ESC/POS Commands:\n');
    const commands = decodeESCPOSCommands(buffer);

    // Group commands by text section for readability
    let currentSection: string[] = [];
    let sectionNumber = 1;

    for (const cmd of commands) {
      if (cmd.startsWith('TEXT:')) {
        currentSection.push(cmd);
      } else {
        if (currentSection.length > 0) {
          console.log(`\n--- Section ${sectionNumber} ---`);
          currentSection.forEach(line => console.log(line));
          currentSection = [];
          sectionNumber++;
        }
        console.log(cmd);
      }
    }

    if (currentSection.length > 0) {
      console.log(`\n--- Section ${sectionNumber} ---`);
      currentSection.forEach(line => console.log(line));
    }

    // Display hex dump of first 200 bytes for inspection
    console.log('\n\n📝 Hex dump (first 200 bytes):');
    const hexDump = buffer.slice(0, 200).toString('hex').match(/.{1,2}/g)?.join(' ') || '';
    console.log(hexDump);

    // Summary
    console.log('\n\n📈 Font Size Mapping Summary (ESC ! Command):');
    console.log('  8-12px  → 1x1 (ESC ! 0x00 - normal)');
    console.log(' 13-18px  → 1x2 (ESC ! 0x10 - double height)');
    console.log(' 19-24px  → 2x1 (ESC ! 0x20 - double width)');
    console.log(' 25+px    → 2x2 (ESC ! 0x30 - double both, max size)');

    // Print to serial port if requested
    if (shouldPrint) {
      await printToSerial(buffer, portName);
      console.log('✨ Test printed successfully!');
    } else {
      console.log('\n💡 Usage Tips:');
      console.log('   --print                  : Send to printer on COM4');
      console.log('   --port=COM5              : Use a different port');
      console.log('   --adapter=escpos         : Use ESC/POS protocol (default)');
      console.log('   --adapter=escbematech    : Use ESC/Bematech protocol');
      console.log('\n   Example: npm run test --adapter=escbematech --print');
      console.log('\n✨ Test completed successfully!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runFontSizeTest();

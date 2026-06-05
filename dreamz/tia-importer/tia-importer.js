/**
 * Dreamz SCADA — TIA Portal Tag Importer
 *
 * Converts TIA Portal XML tag export to FUXA-compatible JSON
 */

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');  // npm install fast-xml-parser

// ── Data type mapping: TIA Portal → FUXA ──────────────────────────

const TYPE_MAP = {
  'Bool':   'Bool',
  'Byte':   'Byte',
  'Word':   'Word',
  'DWord':  'DWord',
  'Int':    'Int',
  'DInt':   'DInt',
  'Real':   'Real',
  'LReal':  'Real',      // downcast — FUXA doesn't have LReal
  'String': 'String',
  'Time':   'DInt',      // TIME stored as ms integer
  'Date':   'DInt',
  'TOD':    'DInt',
};

// ── Address normalizer ────────────────────────────────────────────

function normalizeAddress(addr, datatype) {
  // TIA uses %Q0.0, %I0.1, %MW10, %MD20 etc.
  // node-snap7 (S7 protocol) uses DB notation OR I/Q/M areas
  // Return address as-is for OPC-UA; for direct S7 leave as-is
  return addr ? addr.trim() : '';
}

// ── Slugify tag name to create stable ID ─────────────────────────

let idCounter = 1;

function makeId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  return `tag_${slug}_${String(idCounter++).padStart(3, '0')}`;
}

// ── Parse TIA XML ────────────────────────────────────────────────

function parseTiaXml(xmlFilePath) {
  const xml = fs.readFileSync(xmlFilePath, 'utf-8');
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xml);

  // Handle both Tagtable root and nested structures
  let rawTags = [];

  if (parsed.Tagtable && parsed.Tagtable.Tag) {
    rawTags = Array.isArray(parsed.Tagtable.Tag)
      ? parsed.Tagtable.Tag
      : [parsed.Tagtable.Tag];
  } else if (parsed.Tags && parsed.Tags.Tag) {
    rawTags = Array.isArray(parsed.Tags.Tag)
      ? parsed.Tags.Tag
      : [parsed.Tags.Tag];
  } else {
    throw new Error('Unrecognized XML structure. Expected <Tagtable> or <Tags> root.');
  }

  return rawTags;
}

// ── Convert to FUXA format ────────────────────────────────────────

function convertToFuxaTags(rawTags, deviceName) {
  idCounter = 1;
  const tags = [];
  const skipped = [];

  for (const tag of rawTags) {
    const name = tag.name || tag['@_name'];
    const datatype = tag.datatype || tag['@_datatype'] || 'Bool';
    const address = tag.address || tag['@_address'] || '';
    const comment = tag.comment || tag['@_comment'] || '';
    const hmiVisible = tag.hmiVisible || tag['@_hmiVisible'];

    // Skip tags marked as not HMI-visible (optional filter)
    if (hmiVisible === 'False' || hmiVisible === false) {
      skipped.push(name);
      continue;
    }

    const fuxaType = TYPE_MAP[datatype];
    if (!fuxaType) {
      console.warn(`WARNING: Unknown datatype '${datatype}' for tag '${name}' — skipping`);
      skipped.push(name);
      continue;
    }

    const fuxaTag = {
      id: makeId(name),
      name: name,
      label: name.replace(/_/g, ' '),   // 'Motor1_Start' → 'Motor1 Start'
      type: fuxaType,
      address: normalizeAddress(address, datatype),
      deviceName: deviceName,
      rw: address.startsWith('%Q') ? 'rw' : 'r',  // outputs are writable
      description: comment,
    };

    tags.push(fuxaTag);
  }

  return { tags, skipped };
}

// ── Main export function ────────────────────────────────────────

function importTiaXml(xmlFilePath, deviceName, outputJsonPath) {
  console.log(`Parsing: ${xmlFilePath}`);

  const rawTags = parseTiaXml(xmlFilePath);
  console.log(`Found ${rawTags.length} raw tags`);

  const { tags, skipped } = convertToFuxaTags(rawTags, deviceName);
  console.log(`Converted: ${tags.length} tags`);
  console.log(`Skipped:   ${skipped.length} tags (not HMI-visible or unknown type)`);

  fs.writeFileSync(outputJsonPath, JSON.stringify(tags, null, 2));
  console.log(`Output written to: ${outputJsonPath}`);

  return { tags, skipped, total: rawTags.length };
}

module.exports = { importTiaXml, convertToFuxaTags, parseTiaXml };

// ── CLI usage ────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node tia-importer.js <input.xml> <DeviceName> <output.json>');
    console.log('Example: node tia-importer.js tags.xml "Siemens_PLC_1" fuxa_tags.json');
    process.exit(1);
  }

  importTiaXml(args[0], args[1], args[2]);
}
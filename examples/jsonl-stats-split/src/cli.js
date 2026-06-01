import { loadRecords, report } from './stats.js';
import process from 'process';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: File path required');
  process.exit(1);
}

try {
  const records = loadRecords(filePath);
  const result = report(records);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

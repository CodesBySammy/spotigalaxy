/**
 * @file lrcParser.test.js
 * @description Quick sanity test runner for LRC parsing logic.
 */

import { parseLrc } from '../utils/lrcParser.js';

const sampleLrc = `
[ti:Constellation Skies]
[ar:Nova Echo]
[al:Astral Voyage]
[length:03:45]

[00:05.12]Staring out into the endless dark
[00:10.500]Igniting memories like a spark
[00:15.80][00:30.20]A celestial melody echoes deep
[00:22.00]
[00:25.75]While all the forgotten galaxies sleep
`;

console.log('--- Testing LRC Parser ---');
const parsed = parseLrc(sampleLrc);
console.log('Parsed lines count:', parsed.length);
console.log(JSON.stringify(parsed, null, 2));

// Assertions
const expectedTimes = [5.12, 10.5, 15.8, 25.75, 30.2];
const timesMatch = expectedTimes.every((t, idx) => Math.abs(parsed[idx].time - t) < 0.01);

if (timesMatch && parsed.length === 5) {
  console.log('✅ LRC Parser unit tests PASSED successfully.');
} else {
  console.error('❌ LRC Parser unit test FAILED.');
  process.exit(1);
}


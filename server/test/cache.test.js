/**
 * @file cache.test.js
 * @description Stress and correctness tests for BoundedLRUCache.
 */

import { strict as assert } from 'assert';
import { BoundedLRUCache } from '../utils/cache.js';

console.log('--- Testing BoundedLRUCache ---');

// 1. Basic get/set
const cache = new BoundedLRUCache(3, 1000);
cache.set('a', 1);
cache.set('b', 2);
cache.set('c', 3);

assert.equal(cache.get('a'), 1);
assert.equal(cache.get('b'), 2);
assert.equal(cache.get('c'), 3);
assert.equal(cache.size, 3);
console.log('✅ Basic get/set and capacity passed.');

// 2. LRU eviction (accessing 'a' makes 'b' the oldest)
cache.get('a'); // recency: b, c, a
cache.set('d', 4); // should evict 'b'

assert.equal(cache.get('b'), undefined, 'b should have been evicted as oldest');
assert.equal(cache.get('a'), 1, 'a should still exist');
assert.equal(cache.get('c'), 3, 'c should still exist');
assert.equal(cache.get('d'), 4, 'd should exist');
assert.equal(cache.size, 3);
console.log('✅ LRU eviction order passed.');

// 3. Stress test with 100,000 operations (guarantees NO ECACHEFULL or memory explosion)
const stressCache = new BoundedLRUCache(500, 60000);
for (let i = 0; i < 100000; i++) {
  stressCache.set(`key_${i % 2000}`, { data: `value_${i}` });
  if (i % 3 === 0) {
    stressCache.get(`key_${(i - 10) % 2000}`);
  }
}
assert(stressCache.size <= 500, `Cache size should never exceed maxSize 500, got ${stressCache.size}`);
console.log(`✅ 100,000 rapid operations handled with 0 errors. Bounded size: ${stressCache.size}.`);

// 4. Custom TTL expiration test
const ttlCache = new BoundedLRUCache(10, 50); // 50ms TTL
ttlCache.set('temp', 'expires-soon', 20); // 20ms TTL
assert.equal(ttlCache.get('temp'), 'expires-soon');

setTimeout(() => {
  assert.equal(ttlCache.get('temp'), undefined, 'temp should have expired');
  console.log('✅ TTL expiration passed.');
  console.log('🎉 All BoundedLRUCache tests PASSED successfully!');
}, 35);


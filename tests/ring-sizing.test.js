import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRingSizing } from '../utils/ringSizing.js';
import Product from '../models/Product.js';

test('adjustable sizing removes incompatible size choices', () => {
  const product = { ringSizeMode: 'adjustable', showSizeOptions: true, sizeOptions: [{ name: 'US 6', price: 1500 }] };
  assert.equal(normalizeRingSizing(product), '');
  assert.equal(product.showSizeOptions, false);
  assert.deepEqual(product.sizeOptions, []);
});

test('listed ring sizes enable selection and survive product schema serialization', () => {
  const ring = { id: 1, name: 'Ring', keyGift: ['ring'], price: 1500, ringSizeMode: 'available', sizeOptions: [{ name: 'US 6', price: 1500 }] };
  assert.equal(normalizeRingSizing(ring), '');
  const product = new Product({ category: 'giftsForHer', products: [ring] });
  assert.equal(product.validateSync(), undefined);
  assert.equal(product.toObject().products[0].ringSizeMode, 'available');
  assert.equal(product.toObject().products[0].showSizeOptions, true);
});

test('existing standard sizes remain unchanged', () => {
  const product = { showSizeOptions: true, sizeOptions: [{ name: 'Large', price: 2000 }] };
  assert.equal(normalizeRingSizing(product), '');
  assert.equal(product.ringSizeMode, 'none');
  assert.equal(product.showSizeOptions, true);
  assert.equal(product.sizeOptions[0].name, 'Large');
});

test('rejects incomplete, duplicate, invalid, and empty ring options', () => {
  for (const sizeOptions of [[], [{ name: '', price: 1500 }], [{ name: 'US 6', price: 0 }], [{ name: 'US 6', price: 1500 }, { name: ' us 6 ', price: 1500 }]]) {
    assert.ok(normalizeRingSizing({ ringSizeMode: 'available', sizeOptions }));
  }
  assert.ok(normalizeRingSizing({ ringSizeMode: 'invalid' }));
});

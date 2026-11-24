import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Keep controller tests independent of local credentials, MongoDB, and email.
const configMock = mock.method(dotenv, 'config', () => ({}));
const transportMock = mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => ({}) }));
const logMock = mock.method(console, 'log', () => {});
const { createOrder } = await import('../controllers/orderController.js');
configMock.mock.restore();
transportMock.mock.restore();
logMock.mock.restore();

const shippingInfo = {
  firstName: 'Test', lastName: 'Customer', email: 'customer@example.com', phone: '03000000000',
  street: 'Test street', city: 'Karachi', state: 'Sindh', postalCode: '74000', country: 'Pakistan',
};

async function placeOrder(t, { allowCakeMessage = true, messages = ['Happy Birthday!'], withCard = false, productOverrides = {}, selectedSizes = [] } = {}) {
  const cake = { id: 1, name: 'Birthday Cake', price: 2000, allowCakeMessage, ...productOverrides };
  t.mock.method(Product, 'find', () => ({ lean: async () => [
    { category: 'sweetTreats', products: [cake] },
    { category: 'greetingCards', products: [{ id: 2, name: 'Birthday Card', price: 150 }] },
  ] }));
  const saved = [];
  t.mock.method(Order.prototype, 'save', async function () {
    const error = this.validateSync();
    if (error) throw error;
    // Mongoose casting/serialization must preserve the message in the saved item.
    saved.push(this.toObject());
    return this;
  });
  t.mock.method(console, 'log', () => {});
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await createOrder({ body: {
    shippingInfo, paymentMethod: 'cod', orderItems: messages.map((cakeMessage, index) => ({
      category: 'sweetTreats', id: 1, name: cake.name, quantity: 1, price: 2000,
      selectedSize: selectedSizes[index],
      personalization: {
        ...(cakeMessage !== undefined ? { cakeMessage } : {}),
        ...(withCard ? { card: { id: 2, productCategory: 'greetingCards' }, messageMode: 'write', from: 'Ali', to: 'Sara', message: 'Enjoy your day!' } : {}),
      },
    })),
  } }, response);
  return { response, saved };
}

test('adjustable rings save the catalog size automatically rather than trusting the requested size', async (t) => {
  const { response, saved } = await placeOrder(t, { productOverrides: { ringSizeMode: 'adjustable' }, selectedSizes: ['US 99'] });
  assert.equal(response.statusCode, 201);
  assert.equal(saved[0].orderItems[0].selectedSize, 'Adjustable');
});

test('listed ring sizes retain separate selections and use catalog prices', async (t) => {
  const { response, saved } = await placeOrder(t, {
    productOverrides: { ringSizeMode: 'available', sizeOptions: [{ name: 'US 6', price: 2100 }, { name: 'US 7', price: 2200 }] },
    messages: [undefined, undefined], selectedSizes: ['US 6', 'US 7'],
  });
  assert.equal(response.statusCode, 201);
  assert.deepEqual(saved[0].orderItems.map((item) => [item.selectedSize, item.priceAtTimeOfOrder]), [['US 6', 2100], ['US 7', 2200]]);
});

for (const selectedSize of [undefined, 'US 99', 'Adjustable']) {
  test(`rejects an unavailable or missing ring size: ${selectedSize}`, async (t) => {
    const { response, saved } = await placeOrder(t, {
      productOverrides: { ringSizeMode: 'available', sizeOptions: [{ name: 'US 6', price: 2100 }] },
      selectedSizes: [selectedSize],
    });
    assert.equal(response.statusCode, 400);
    assert.equal(saved.length, 0);
  });
}

test('saves separate trimmed cake messages alongside greeting card personalization', async (t) => {
  const { response, saved } = await placeOrder(t, { messages: ['  Happy Birthday, Ali!  ', 'Happy Birthday, Sara!'], withCard: true });
  assert.equal(response.statusCode, 201);
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].orderItems.map((item) => item.personalization.cakeMessage), ['Happy Birthday, Ali!', 'Happy Birthday, Sara!']);
  assert.equal(saved[0].orderItems[0].personalization.message, 'Enjoy your day!');
  assert.equal(saved[0].orderItems[0].personalization.card.name, 'Birthday Card');
});

test('accepts exactly 50 characters', async (t) => {
  const { response, saved } = await placeOrder(t, { messages: ['x'.repeat(50)] });
  assert.equal(response.statusCode, 201);
  assert.equal(saved[0].orderItems[0].personalization.cakeMessage.length, 50);
});

test('blank and omitted cake messages are optional on existing products', async (t) => {
  const { response, saved } = await placeOrder(t, { allowCakeMessage: false, messages: ['   ', undefined] });
  assert.equal(response.statusCode, 201);
  assert.ok(saved[0].orderItems.every((item) => !item.personalization?.cakeMessage));
});

for (const [name, options] of [
  ['overlong text', { messages: ['x'.repeat(51)] }],
  ['non-text input', { messages: [{ message: 'Hello' }] }],
  ['messages on disabled products', { allowCakeMessage: false }],
]) {
  test(`rejects ${name} before saving`, async (t) => {
    const { response, saved } = await placeOrder(t, options);
    assert.equal(response.statusCode, 400);
    assert.equal(saved.length, 0);
  });
}

import { describe, it, expect } from 'vitest';
import { deliverySettingsSchema, deliveryTokenRequestSchema, isAllowedDeliveryUrl } from './delivery.js';

describe('delivery addresses', () => {
  it('accepts https anywhere, and plain http only on this computer', () => {
    expect(isAllowedDeliveryUrl('https://forms.example.org/receive')).toBe(true);
    expect(isAllowedDeliveryUrl('http://localhost:4000/submissions')).toBe(true);
    expect(isAllowedDeliveryUrl('http://127.0.0.1:4000/x')).toBe(true);
    expect(isAllowedDeliveryUrl('http://forms.example.org/receive')).toBe(false);
    expect(isAllowedDeliveryUrl('ftp://example.org')).toBe(false);
    expect(isAllowedDeliveryUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedDeliveryUrl('not an address')).toBe(false);
  });

  it('never puts a user name or password in an address every browser is given', () => {
    expect(isAllowedDeliveryUrl('https://user:secret@example.org/x')).toBe(false);
  });

  it('saves an address or null, and nothing else', () => {
    expect(deliverySettingsSchema.safeParse({ url: ' https://example.org/in ' }).data).toEqual({ url: 'https://example.org/in' });
    expect(deliverySettingsSchema.safeParse({ url: null }).success).toBe(true);
    expect(deliverySettingsSchema.safeParse({ url: 'https://example.org', secret: 'x' }).success).toBe(false);
  });

  it('asks for a token with the version answered only - never answers', () => {
    expect(deliveryTokenRequestSchema.safeParse({ version: 3 }).success).toBe(true);
    expect(deliveryTokenRequestSchema.safeParse({ version: 3, answers: {} }).success).toBe(false);
  });
});

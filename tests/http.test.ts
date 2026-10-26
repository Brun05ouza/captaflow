import { describe, expect, it } from 'vitest';
import { jsonBody, sameOrigin } from '../src/lib/http';
import { whatsappNumber } from '../src/lib/utils';
describe('proteção de requisições', () => {
  it('valida o corpo como objeto JSON', async () => {
    expect(
      await jsonBody(new Request('http://localhost', { method: 'POST', body: '{"name":"Ana"}' })),
    ).toEqual({ name: 'Ana' });
    for (const body of ['null', '[]', 'broken'])
      await expect(
        jsonBody(new Request('http://localhost', { method: 'POST', body })),
      ).rejects.toMatchObject({ status: 400 });
  });
  it('limita bytes mesmo sem content-length e com unicode', async () => {
    const text = JSON.stringify({ notes: 'ã'.repeat(9000) });
    await expect(
      jsonBody(new Request('http://localhost', { method: 'POST', body: text })),
    ).rejects.toMatchObject({ status: 413 });
  });
  it('rejeita origem externa e ausência de origem', () => {
    for (const origin of ['https://evil.example', ''])
      expect(() => sameOrigin(new Request('http://localhost', { headers: { origin } }))).toThrow();
  });
  it('normaliza número nacional para WhatsApp preservando país explícito', () => {
    expect(whatsappNumber('(11) 99999-9999')).toBe('5511999999999');
    expect(whatsappNumber('+1 415 555 1234')).toBe('14155551234');
  });
});

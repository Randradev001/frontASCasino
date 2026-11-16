const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

// Resolve through the actual consumer, not directly through the vendor directory.
const consumerRequire = createRequire(require.resolve('@rollup/plugin-node-resolve'));
const merge = consumerRequire('deepmerge');

test('Rollup utiliza el fork local revisado de deepmerge', () => {
  const manifest = consumerRequire('deepmerge/package.json');
  assert.equal(manifest.name, '@adp/deepmerge');
  assert.equal(manifest.version, '4.3.1-adp.1');
});

test('no hereda propiedades inyectadas desde ninguno de los operandos', () => {
  const poisoned = JSON.parse('{"__proto__":{"isAdmin":true},"safe":1}');
  for (const result of [merge(poisoned, {}), merge({}, poisoned), merge(poisoned, poisoned)]) {
    assert.equal(Object.getPrototypeOf(result), Object.prototype);
    assert.equal(result.isAdmin, undefined);
    assert.equal(Object.hasOwn(result, '__proto__'), false);
    assert.equal(result.safe, 1);
  }
  assert.equal({}.isAdmin, undefined);
});

test('bloquea claves peligrosas recursivas y objetos sin prototipo', () => {
  const payload = JSON.parse(
    '{"nested":{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}},"prototype":{"polluted":true},"ok":2}}'
  );
  const result = merge(Object.create(null), payload);
  assert.deepEqual(result, { nested: { ok: 2 } });
  assert.equal({}.polluted, undefined);
});

test('no evalúa getters de claves peligrosas al copiar el destino', () => {
  const target = {};
  Object.defineProperty(target, '__proto__', {
    enumerable: true,
    get() {
      throw new Error('no debe ejecutarse');
    }
  });
  assert.deepEqual(merge(target, { ok: 1 }), { ok: 1 });
});

test('conserva fusiones, arrays, símbolos y opciones usadas por consumidores', () => {
  const marker = Symbol('marker');
  const target = { values: [1], nested: { a: 1 }, [marker]: { first: true } };
  const result = merge(target, { values: [2], nested: { b: 2 }, [marker]: { second: true } });
  assert.deepEqual(result.values, [1, 2]);
  assert.deepEqual(result.nested, { a: 1, b: 2 });
  assert.deepEqual(result[marker], { first: true, second: true });
  assert.deepEqual(target.values, [1]);
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  assert.deepEqual(merge({ values: [1] }, { values: [2] }, { arrayMerge: (_target, source) => source }), { values: [2] });
});

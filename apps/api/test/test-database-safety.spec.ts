const { requireTestDatabaseUrl, requireOwnedSchema, newTestSchema } = require('../../../scripts/lib/test-database.cjs');

describe('Disposable database connection safety', () => {
  it.each([
    undefined,
    '',
    'postgresql://user:pass@production.example/car_security_test_fixture',
    'postgresql://user:pass@localhost/car',
    'postgresql://user:pass@localhost/postgres',
    'postgresql://user:pass@localhost/car_security_test_fixture?host=production.example',
    'postgresql://user:pass@localhost/car_security_test_fixture?options=unsafe',
    'file:///car_security_test_fixture',
  ])('rejects an unsafe or implicit database configuration %#', input => {
    expect(() => requireTestDatabaseUrl(input)).toThrow();
  });
  it('accepts only an explicit localhost disposable database', () => {
    expect(requireTestDatabaseUrl('postgresql://fixture:fixture@127.0.0.1:55432/car_security_test_fixture').hostname).toBe('127.0.0.1');
  });
  it.each(['public', 'car', 'security_test_', 'security_test_a; DROP SCHEMA public', undefined])('rejects a non-owned schema %#', schema => {
    expect(() => requireOwnedSchema(schema)).toThrow();
  });
  it('generates a unique restricted schema identifier for each run', () => {
    const a = newTestSchema();
    expect(requireOwnedSchema(a)).toBe(a);
    expect(newTestSchema()).not.toBe(a);
  });
});

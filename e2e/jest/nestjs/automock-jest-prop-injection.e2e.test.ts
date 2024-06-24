import type { UnitReference, Mocked, Stub } from '@suites/unit';
import { TestBed } from '@suites/unit';
import type { Logger, TestClassFive } from './e2e-assets';
import {
  ClassThatIsNotInjected,
  NestJSTestClassProp,
  SymbolToken,
  TestClassFour,
  TestClassOne,
  TestClassTwo,
} from './e2e-assets';

describe('Suites Jest / NestJS E2E Test Props', () => {
  let unit: NestJSTestClassProp;
  let unitRef: UnitReference;

  beforeAll(async () => {
    const { unitRef: ref, unit: underTest } = await TestBed.solitary<NestJSTestClassProp>(
      NestJSTestClassProp
    )
      .mock(TestClassOne)
      .impl((stubFn: Stub) => ({
        foo: stubFn().mockResolvedValue('foo-from-test'),
      }))
      .mock<string>('CONSTANT_VALUE')
      .final('arbitrary-string')
      .mock('UNDEFINED')
      .final({ method: () => 456 })
      .mock<Logger>('LOGGER')
      .final({ log: () => 'baz-from-test' })
      .mock<TestClassFive>(SymbolToken)
      .final({ doSomething: () => 'mocked' })
      .compile();

    unitRef = ref;
    unit = underTest;
  });

  describe('when compiling the builder and turning into testing unit', () => {
    test('then the unit should an instance of the class under test', () => {
      expect(unit).toBeInstanceOf(NestJSTestClassProp);
    });

    test('then do not return the actual reflected dependencies of the injectable class', () => {
      expect(() => unitRef.get(TestClassOne)).toBeDefined();
      expect(() => unitRef.get(TestClassTwo)).toBeDefined();
    });

    test('then mock the implementation of the dependencies', async () => {
      const testClassOne: Mocked<TestClassOne> = unitRef.get(TestClassOne);

      // The original 'foo' method in TestClassOne return value should be changed
      // according to the passed flag; here, always return the same value
      // because we mock the implementation of foo permanently
      await expect(testClassOne.foo(true)).resolves.toBe('foo-from-test');
      await expect(testClassOne.foo(false)).resolves.toBe('foo-from-test');
    });

    test('then all the unoverride classes/dependencies should be stubs as well', () => {
      const testClassTwo: Mocked<TestClassTwo> = unitRef.get(TestClassTwo);

      expect(testClassTwo.bar.getMockName).toBeDefined();
      expect(testClassTwo.bar.getMockName()).toBe('jest.fn()');
    });

    test('call the unit instance method', async () => {
      const testClassTwo: Mocked<TestClassTwo> = unitRef.get(TestClassTwo);

      testClassTwo.bar.mockResolvedValue('context');

      const result = await unit.test();
      expect(result).toBe('context-baz-from-test');
    });

    test('then mock the undefined reflected values and tokens', () => {
      const testClassFour: Mocked<TestClassFour> = unitRef.get(TestClassFour);
      testClassFour.doSomething.mockReturnValue('mocked');

      expect(testClassFour.doSomething()).toBe('mocked');
    });

    test('then throw an error when trying to resolve not existing dependency', () => {
      expect(() => unitRef.get(ClassThatIsNotInjected)).toThrow();
    });
  });
});

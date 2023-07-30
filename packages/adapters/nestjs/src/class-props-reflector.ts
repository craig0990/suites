import { MetadataReflector, NestJSInjectable, ReflectedProperty } from './types';
import { ClassPropsInjectables, PrimitiveValue } from '@automock/common';
import { Type } from '@automock/types';
import { PROPERTY_DEPS_METADATA } from '@nestjs/common/constants';

export type ClassPropsReflector = ReturnType<typeof ClassPropsReflector>;

export function ClassPropsReflector(reflector: MetadataReflector) {
  function reflectInjectables(targetClass: Type): ClassPropsInjectables {
    const classProperties = reflectProperties(targetClass)(reflector);
    const classInstance = Object.create(targetClass.prototype);

    return classProperties.map(({ key, type }) => {
      const reflectedType = reflector.getMetadata(
        'design:type',
        classInstance,
        key
      ) as NestJSInjectable;

      if (!reflectedType) {
        throw new Error(
          `Automock has failed to reflect '${targetClass.name}.${key}' property, did you forget to inject it using @Inject()?`
        );
      }

      let value;

      if (typeof type === 'object' && 'forwardRef' in type) {
        value = type.forwardRef();
      } else {
        value = type;
      }

      return {
        property: key,
        typeOrToken: value as string | Type,
        value:
          typeof type === 'string' ? (reflectedType as Type) : (value as PrimitiveValue | Type),
      };
    });
  }

  function reflectProperties(
    targetClass: Type
  ): (reflector: MetadataReflector) => ReflectedProperty[] {
    return (reflector: MetadataReflector) =>
      reflector.getMetadata(PROPERTY_DEPS_METADATA, targetClass) || [];
  }

  return { reflectInjectables };
}

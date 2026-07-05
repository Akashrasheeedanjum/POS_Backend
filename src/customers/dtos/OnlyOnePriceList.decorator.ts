import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function OnlyOnePriceList(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'onlyOnePriceList',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const obj = args.object as any;
          const keys = ['usePriceList1', 'usePriceList2', 'usePriceList3', 'usePriceList4'];

          const definedKeys = keys.filter((key) => obj[key] !== undefined);
          return definedKeys.length === 0 || definedKeys.length === 1;
        },
        defaultMessage(_: ValidationArguments) {
          return 'Only one of usePriceList1, usePriceList2, usePriceList3, or usePriceList4 may be provided at a time.';
        },
      },
    });
  };
}

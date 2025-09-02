/**
 * Polyfill for Object.hasOwn() - ES2022 feature
 * Provides compatibility for older browsers that don't support Object.hasOwn
 * 
 * Object.hasOwn() is a safer alternative to Object.prototype.hasOwnProperty.call()
 * that works correctly even with objects that don't inherit from Object.prototype
 */

export function objectHasOwn(object: any, property: string | number | symbol): boolean {
  if (object == null) {
    throw new TypeError('Object.hasOwn called on null or undefined');
  }
  
  return Object.prototype.hasOwnProperty.call(Object(object), property);
}

/**
 * Apply Object.hasOwn polyfill globally if not supported
 * Must be called before any code that might use Object.hasOwn
 */
export function applyObjectHasOwnPolyfill(): void {
  if (typeof (Object as any).hasOwn !== 'function') {
    console.warn('Browser lacks Object.hasOwn support, applying polyfill');
    (Object as any).hasOwn = objectHasOwn;
  }
}
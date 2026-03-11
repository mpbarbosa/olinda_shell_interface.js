# Utils — General Utility Functions

**Re-exported from:** [`olinda_utils.js`](https://github.com/mpbarbosa/olinda_utils.js)
**Available since:** `olinda_shell_interface.js` v0.5.6
**Type:** Pure Functions Only

## Overview

26 pure utility functions for strings, arrays, and objects.
All functions are referentially transparent — deterministic output, no side effects, no logging, no global state.

```typescript
import {
  camelCase, deepClone, isEmpty,
} from 'olinda_shell_interface.js';
```

---

## String Utilities

### `camelCase(str)`

Convert a string to `camelCase`.

```typescript
camelCase('hello-world')  // 'helloWorld'
camelCase('hello_world')  // 'helloWorld'
camelCase(null)           // ''
```

---

### `kebabCase(str)`

Convert a string to `kebab-case`.

```typescript
kebabCase('helloWorld')  // 'hello-world'
kebabCase('Hello World') // 'hello-world'
```

---

### `snakeCase(str)`

Convert a string to `snake_case`.

```typescript
snakeCase('helloWorld')   // 'hello_world'
snakeCase('Hello-World')  // 'hello_world'
```

---

### `pascalCase(str)`

Convert a string to `PascalCase`.

```typescript
pascalCase('hello-world')  // 'HelloWorld'
pascalCase('hello world')  // 'HelloWorld'
```

---

### `capitalize(str)`

Capitalize the first letter of a string.

```typescript
capitalize('hello')  // 'Hello'
capitalize('')       // ''
capitalize(null)     // ''
```

---

### `truncate(str, length, suffix?)`

Truncate to `length` characters, appending `suffix` (default `'...'`).

```typescript
truncate('hello world', 8)        // 'hello...'
truncate('hello world', 8, '…')   // 'hello w…'
truncate('hi', 10)                // 'hi'
```

---

### `sanitize(str, allowed?)`

Keep only alphanumeric characters plus the `allowed` set (default `'-_'`).

```typescript
sanitize('hello@world!')           // 'helloworld'
sanitize('hello-world_test', '-_') // 'hello-world_test'
sanitize(null)                     // ''
```

---

### `cleanWhitespace(str)`

Collapse multiple spaces and trim.

```typescript
cleanWhitespace('  hello   world  ')  // 'hello world'
cleanWhitespace(null)                  // ''
```

---

### `escapeRegex(str)`

Escape all special RegExp metacharacters.

```typescript
escapeRegex('a.b*c')   // 'a\\.b\\*c'
escapeRegex('(test)')  // '\\(test\\)'
escapeRegex(null)      // ''
```

---

## Array Utilities

### `dedupe<T>(arr)`

Remove duplicate values (uses strict equality).

```typescript
dedupe([1, 2, 2, 3])          // [1, 2, 3]
dedupe(['a', 'b', 'a'])       // ['a', 'b']
```

---

### `chunk<T>(arr, size)`

Split an array into fixed-size chunks.

```typescript
chunk([1, 2, 3, 4, 5], 2)  // [[1, 2], [3, 4], [5]]
```

---

### `flatten<T>(arr, depth?)`

Recursively flatten a nested array. Default depth is `Infinity`.

```typescript
flatten([[1, 2], [3, [4]]])     // [1, 2, 3, 4]
flatten([[1, [2, [3]]]], 1)     // [1, 2, [3]]
```

---

### `groupBy<T>(arr, keyOrFn)`

Group array elements by a key name or a key-extraction function.

```typescript
groupBy([{ type: 'a' }, { type: 'b' }, { type: 'a' }], 'type')
// { a: [{ type: 'a' }, { type: 'a' }], b: [{ type: 'b' }] }

groupBy([1, 2, 3], (n) => n % 2 === 0 ? 'even' : 'odd')
// { odd: [1, 3], even: [2] }
```

---

### `sortBy<T>(arr, keyOrFn, order?)`

Sort an array by a key name or key-extraction function. Default order is `'asc'`.

```typescript
sortBy([{ n: 3 }, { n: 1 }, { n: 2 }], 'n')            // [{n:1},{n:2},{n:3}]
sortBy([{ n: 3 }, { n: 1 }], 'n', 'desc')               // [{n:3},{n:1}]
sortBy(['banana', 'apple'], (s) => s.length)             // ['apple', 'banana']
```

---

### `intersection<T>(...arrays)`

Return elements present in all supplied arrays.

```typescript
intersection([1, 2, 3], [2, 3, 4])      // [2, 3]
intersection([1, 2], [2, 3], [2, 4])    // [2]
```

---

### `difference<T>(arr1, arr2)`

Return elements from `arr1` that are not in `arr2`.

```typescript
difference([1, 2, 3], [2, 3])  // [1]
```

---

### `partition<T>(arr, predicate)`

Split an array into two groups: elements that satisfy the predicate (first) and those that don't (second).

```typescript
partition([1, 2, 3, 4], (n) => n % 2 === 0)  // [[2, 4], [1, 3]]
```

---

## Object Utilities

### `deepClone<T>(obj)`

Create a fully independent deep copy of an object or array.

```typescript
const original = { a: { b: 1 } };
const clone = deepClone(original);
clone.a.b = 99;
console.log(original.a.b);  // 1 — original unchanged
```

---

### `deepMerge(target, ...sources)`

Recursively merge source objects into `target`. Nested objects are merged rather than replaced.

```typescript
deepMerge({ a: 1, b: { x: 1 } }, { b: { y: 2 }, c: 3 })
// { a: 1, b: { x: 1, y: 2 }, c: 3 }
```

---

### `pick<T, K>(obj, keys)`

Return a new object with only the specified keys.

```typescript
pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])  // { a: 1, c: 3 }
```

---

### `omit<T, K>(obj, keys)`

Return a new object with the specified keys removed.

```typescript
omit({ a: 1, b: 2, c: 3 }, ['b'])  // { a: 1, c: 3 }
```

---

### `getProperty<T>(obj, path, defaultValue?)`

Read a nested property via dot-notation path.

```typescript
getProperty({ a: { b: 42 } }, 'a.b')        // 42
getProperty({ a: 1 }, 'a.b.c', 'fallback')  // 'fallback'
```

---

### `setProperty<T>(obj, path, value)`

Write a value at a dot-notation path, creating intermediate objects as needed.

```typescript
setProperty({}, 'a.b.c', 7)  // { a: { b: { c: 7 } } }
```

---

### `hasProperty(obj, path)`

Check whether a dot-notation path exists (and is not `undefined`).

```typescript
hasProperty({ a: { b: 1 } }, 'a.b')   // true
hasProperty({ a: { b: 1 } }, 'a.c')   // false
```

---

### `deepEqual(a, b)`

Recursively compare two values for structural equality.

```typescript
deepEqual({ a: [1, 2] }, { a: [1, 2] })  // true
deepEqual({ a: 1 }, { a: 2 })            // false
```

---

### `isEmpty(value)`

Return `true` for empty strings, arrays, objects, `null`, and `undefined`.

```typescript
isEmpty({})         // true
isEmpty([])         // true
isEmpty('')         // true
isEmpty(null)       // true
isEmpty({ a: 1 })   // false
isEmpty([0])        // false
```

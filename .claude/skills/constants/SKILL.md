---
name: constants
description: Use to extract app configuration behaviour fine tuning knob constants.
---

Single global config file `/config/constants.ts` or per-module config files in `/config/editor.ts` for modules with large amount of constants worth extracting.

Look at semantics for keys and names casing:

- constant colleciton names and constant names - uppercase keys - semantically single independent value, grouped for convenience
- single constant config value expressed as object of a certain shape - camelCase keys

```js
// example

const COLLECTION1 = {
	PARAM1: 'value1',
	PARAM2: 'value2',
}

const COLLECTION2 = {
	PARAM1: 'value1',
	PARAM2: {
		field1: 'value1',
		field2: 'value2',
	},
}
```

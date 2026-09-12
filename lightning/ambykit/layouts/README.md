# Your layouts

Drop a `.axo` file here and name it in a slide's frontmatter (`layout: foo`).
A layout named after a built-in overrides Axo's version.

```axo
---
export const sectionClass = 'quote-slide';
---
<slot />
```

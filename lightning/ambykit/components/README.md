# Your components

Drop a `.axo` file here. **The filename is the component name** — `Pricing.axo`
gives you `<Pricing>`. No registration step.

A file named after a built-in (`Matrix.axo`) **overrides** Axo's version — you don't have
to fork the framework to change one component.

```axo
---
const { name, price, featured } = Axo.props;
---

<div class:list={['step', featured && 'featured']}>
  <span class="n">{name}</span>
  <h4>{price}</h4>
  <p><slot /></p>
</div>
```

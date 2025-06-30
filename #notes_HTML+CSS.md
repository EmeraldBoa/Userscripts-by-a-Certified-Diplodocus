# GOALS

# Would like to learn

*  

# Accessibility

### General notes & best practices

* **semantic HTML** where possible, **ARIA** only where no other option exists
* **Contrast**
* keyboard navigation
* hide emojis from screen readers (or replace with labels)
* hidden elements must also be hidden from screen readers

## Attributes

[Stackexchange: Accessibility of read-only input fields](https://ux.stackexchange.com/questions/34055/accessibility-vs-read-only-input-fields)

* **`.disabled`:** cannot be interacted with or focused, automatically styled (overriding CSS), hidden from screen readers, not submitted
* **`.readOnly:`** can be focused but not edited, styled via CSS (`:read-only`), revealed to screen readers, submitted with the form


### Navigating

* 


## Aria

### Rules

1. If you can use a native HTML element [HTML51] or attribute with the semantics and behavior you require already built in, instead of re-purposing an element and adding an ARIA role, state or property to make it accessible, then do so.

2. Do not change native semantics unless you really have to.

3. All interactive ARIA controls must be usable with the keyboard.

4. Do not use role="presentation" or aria-hidden="true" on a focusable element.

      * (`display: none;` or `visibility: none;` => element is not focusable)

5. All interactive elements must have an **accessible name**.

      * Give an accessible name by wrapping a label, labels with `for/id` (rule 1)  
      or `aria-label` / `aria-labelledby`

### Attributes

* `aria-hidden`: hide an element from screen readers (e.g. emojis). 
  - Elements which are not rendered (e.g. with `display: none`) are already hidden.
* `aria-pressed`
* `aria-label`
  - avoid on `<footer>`, `<section>`, `<article>`, `<header>`, or any `<h_>` elements. [[w3]](https://www.w3.org/TR/using-aria/#label-support)

* `aria-labelledby`


# CSS

### Specificity hierarchy (most to least specific)

- inline > #id > .class > attribute (e.g `[type="text"]`) > element (e.g `p`).
- `p.class` > `.class`
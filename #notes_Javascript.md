# GOALS

# Code cleanup

* remove unnecessary JQuery imports (page already has JQuery)
* ~~`var`~~; `let` → `const` (where possible)
* simplify nesting with early exits
* arrow functions `() => {}`
* learn promises > simplify
* store functions in objects?
* magic numbers / magic strings
* eslint stylistic (regular formatting)
* css

# Would like to learn

* promises or async/await (which one is recommended?)
* classes
* sodding "this"
* userscript to simple extension?
* abstract syntax trees (parsing purposes)

# The DOM
## Manipulation

* `Node`**`.textContent`:** text of *all* elements, including `<style>` and hidden ones  
`Element`**`.innerText`:** only human-readable text (but triggers **reflow** - expensive)

* ⚠ Setting `.textContent` removes all of the node's children and replaces them with a single text node with the given string value. ⚠

```html
<p>He could think in <em>italics</em>. Such people need watching.<p>
<!--becomes-->
<p>He could think in italics. Such people need watching.<p>
```

## NodeList
* Loop with **`for...of`** or `.forEach` (slower), never with for...in
## Looping through
* Array: `for... of`, `.forEach`, `.map(callback)`

## MutationObserver
* `myObserver.observe(targetElement, config)` where `config` is an object:

      myObserver.observe(targetElement, {childList:true})

    * `childList`: observe if children are added/removed
    * `attributeFilter: ['class']` is an array!
    * UNSURE: are `childList`and `attributeFilter` compatible? (Can we monitor attribute changes in child elements?)

* with one object `myObserver`, can `.observe` multiple targets:

      myObserver.observe(someElement, {childList:true})
      myObserver.observe(anotherElement, {childList:true})

# Functions
* Callback functions cannot take arguments, but we can get around this by wrapping them in an anonymous function - which can be an arrow function. <span style="color:red">**REMEMBER!**</span>

```js
divObserver = new MutationObserver(addButtons(myDiv)) // error
divObserver = new MutationObserver(() => addButtons(myDiv)) // works!
```

## Arrow functions () => {}

* Don't have their own `this`, `arguments` or `super`
* **Not** for constructors or methods

&nbsp;

# Objects

Initialise with `myObj = { key1: 'value1', key2: 'value2', method() {} }`

method vs **`get`** function: 
```js
myObj = {
      dividendo: 54,
      divisor: 5,
      cociente() { return Math.trunc(this.dividendo / this.divisor) },
      get resto() { return this.dividendo % this.divisor },
}
console.log(
      myObj.cociente(), //    '10'
      myObj.cociente, //      'return Math.trunc(this.dividendo / this...'
      myObj.resto, //         '4'

      Object.keys(myObj) //   ['dividendo', 'divisor', 'cociente', 'resto']
      Object.values(myObj) // [54, 5, 'cociente() { return Math... }', 4]
)
```
Note how methods return 

[Querying & traversing object properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Enumerability_and_ownership_of_properties)

# Snippets (misc)

Shorthand aliases for document.querySelector:

```js
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

// Another shorthand - not a perfect substitute for Element.querySelector, but helpful in some cases:

const $ = (sel, root = document) => {root.querySelector(sel)}
$('.class')       /* equivalent to */      document.querySelector('.class')
$('.class', el)   /* equivalent to */      el.querySelector('.class')
```
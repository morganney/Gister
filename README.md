## Gister: Embed GitHub Gists without inline `<script>` tags

Sometimes you don't want to use GitHub's embed `<script>` for sharing Gists on your website.
Gister allows you to embed GitHub Gists in `<code>` elements within your HTML identified by `data-*` attributes with values set to public Gist id's.

The `<code>` elements can be rendered server or client side before embedding your Gists.

### Installation

`npm install gisted` &nbsp; (**d** _not_ **r**)

`bower install gister`


### API

#### `Gister(dataAttrName [, callback(el)])`

Constructs a new instance of Gister. **`dataAttrName` is required**.

For example, if your gists will go inside `<code data-gist-id>` elements then you would create a new instance like `new Gister("gist-id")`.

**NOTE**: "gist-id" is just one example. ```dataAttrName``` can be any string that through concatenation with "data-" creates a valid [data-\*](https://www.w3.org/TR/html5/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes) attribute.

`callback` is an optional function to invoke for each Gist _after_ it has been embedded into the parent `<code>` element. The `callback` will be passed a reference to the `<code>` element.


#### `fetch()`

_for server side rendered `<code>` elements_

If the `<code>` elements are rendered on the server then you want to use `fetch`. This way you can do `new Gister('gistId').fetch()` to immediately update all `<code data-gistId>` elements found in the DOM.

If you load Gister with an inline `<script data-attrName='gistId'>` tag then `fetch` is whats used behind the scenes.

#### `observe(selector)`

_for client side rendered `<code>` elements_

Use MutationObserver to watch the DOM node identified by [`selector`](https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Getting_Started/Selectors) for changes and update the `innerHTML` of all child `<code data-{dataAttrName}>` elements with the Gist identified by the value of the `data-{dataAttrName}` property.

For example, you might update a `<div id='content'>` element with some HTML that contains a `<code data-gistId='00e3c4c4e42c8c4b174a'>` element after page load. In that case you would do  `new Gister('gistId').observe('#content')` some time before `<div id='content'>` is updated to ensure the contents of the gist identified by `00e3c4c4e42c8c4b174a` are included on the page.

#### `poll(selector [, duration])`

_for client side rendered `<code>` elements_

If you want support for older browsers without MutationObserver you can try `poll`.  Its used in exactly the same way as `observe` except it supports an optional `duration` parameter to specifiy how many seconds to poll. Polling **defaults to 10 seconds** otherwise.

**NOTE**: polling will cease once your Gist has been embedded, regardless of whether `duration` seconds has elapsed.

### How To Use

As `window` global loaded with an HTML `<script>` tag:

```html
<script src='/bower_components/gister.js'></script>
<!--
  or to update <code data-gistId> elements in the DOM immediately
  (without using the Gister API at all)
-->
<script src='/bower_components/gister.js' data-attrName='gistId'></script>
```

As a CommonJS/node module:

```javascript
var Gister = require('gisted') // note the 'd' not 'r'

// To update <code data-gist> elements in the DOM immediately
new Gister('gist').fetch()
// If the '#container' element is dynamically updated with <code data-gist> nodes
new Gister('gist').observe('#container')
```

As an AMD module:

```javascript
require(['gister'], function (Gister) {
   // If using Gister with dynamic (ajax) content
   new Gister('myGist').observe('body')
   // Otherwise update the DOM with Gists immediately
   new Gister('myGist').fetch()
})
```
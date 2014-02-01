## Gister: Embed GitHub Gists Dynamically

GitHub's embed ```<script>``` for your hosted Gist only works if it's part of the DOM before your browser's ```window``` has fired its ```onload``` event. Many current websites load the bulk of their content  *after* the ```onload``` event has fired, thus Gister.

If you need to support a browser other than Chrome 32+ (chances are you do), then Gister **requires
a Promise polyfill**: https://github.com/jakearchibald/ES6-Promises

Even with the Promise polyfill, Gister is only supported by modern browsers, and IE 11+. Specificially, Gister works with Chrome 18+, Firefox 14+, Safari 6+, Opera 15+, and IE 11+. If you use a MutationObserver polyfill, Gister can run on IE 9+.

**For mobile browser support see**:

 * http://caniuse.com/mutationobserver
 * http://caniuse.com/promises

### How To Load Gister

Gister can be loaded as an AMD module or a traditional ```<script>``` tag.

#### As an AMD Module
 ```javascript
/*
 * Some module definition that assumes /path/to/local/gister.js
 * is directly under the baseUrl property in the RequireJS configuration.
 * 
 * NOTE: A Promise polyfill must be loaded prior to the module executing.
 * Most likely you've handled this dependency in the RequireJS configuration,
 * or you just load the polyfill globally with a <script> tag.
 */
define([
  'depA',
  'gister',
  'depB'
], function(A, Gister, B) {
   // Define the module using Gister as needed.
});
```
#### As an HTML &lt;script&gt; Tag (creates a global window.Gister)

```html 
<script src="http://s3.amazonaws.com/es6-promises/promise-0.1.1.min.js"></script>
<script src="/path/to/local/gister.js"></script>
```
### How to Use Gister

Gister requires your dynamic content to contain ```<code>``` elements (with an HTML5 ```data-*``` attribute) where you want your Gist to appear. For example:

```html
<p>Some amazing dynamic HTML content ... blah blah ...</p>

<!-- "gistId" can be any value: "gist-id", "foo-bar", etc. -->
<code data-gistId="{your public gist id}"></code>

<p>Blah blah ...</p>
```
Once thats in place, use the **Gister API** to embed your Gists after your application has loaded the dynamic content.

### Gister API

The Gister API is a constructor and set of public methods for a Gister object. Gister uses MutationObserver internally so the API has a similiar syntax and behavior.  The first step is to always construct a Gister object:

#### ```Gister(dataAttrName, [callback])``` 

Creates a new instance of Gister.

 ```dataAttrName``` is required. For example, ```<code data-dataAttrName="12345">```.

```callback``` is an optional function to execute for each Gist *after* it has been embedded into the parent ```<code>``` element. The ```callback``` will be passed a reference to the Gist's parent ```<code>``` element.

#### ```observe(selector)```

Uses MutationObserver to observe a DOM node for changes. This is how you tell Gister to embed Gists into your dynamic content.

```selector``` is a CSS style selector targeting the DOM node that will contain the dynamic content. The node that ```selector``` targets must be present in the DOM prior to loading the dynamic content. It can be as general as targeting the ```<body>```element.


#### ```poll(selector)```

If you don't want to use MutationObserver, or your browser doesn't support it, you can use ```poll``` to poll the DOM for changes to the element targeted by ```selector```. ```poll``` only polls the DOM for 8 seconds, so you should use it right before fetching your dynamic content.

```selector``` is a CSS style selector targeting the DOM node that will contain the dynamic content. The node that ```selector``` targets must be present in the DOM prior to loading the dynamic content. It can be as general as targeting the ```<body>```element.

### Example Usage

```javascript
/*
 * In this example the dynamic content is loaded into an element with 
 * an id attribute of 'post-container', and the Gists are embedded into
 * the following elements:
 *
 *  <code data-gist-id="public_gist_id"></code>
 *
 * The important thing is to observe() or poll() BEFORE fetching the dynamic
 * content which contains the <code> elements.
 */
if(window.MutationObserver && window.Promise) {
  // Should work with modern browsers and IE9+.
  new Gister('gist-id').observe('#post-container');
  // Or, to remove a CSS class after the Gist has been embedded.
  new Gister('gist-id', function(el) {$(el).removeClass('loading');}).observe('#post-container');
  // Now fetch the content and insert it into the DOM node targeted by #post-container.
} else if(window.Promise) {
  // You can use poll() where MutationObserver isn't supported.
  new Gister('gist-id').poll('#post-container');
  // Now fetch the content and insert it into the DOM node targeted by #post-container.
} else {
  // You probably shouldn't use Gister (as-is) to load your Gists.
}
```

## Gister: GitHub Gist Embedding

Sometimes you just don't want to ues GitHub's embed ```<script>``` for hosting Gists on your site. Gister allows you to embed GitHub Gists into your website's HTML content by using  ```<code>``` elements with an HTML5 ```data-*``` attribute as placeholders.

 * [How To Load Gister](#how-to-load-gister)
 * [How To Use Gister](#how-to-use-gister)
 * [Gister API](#gister-api)
 * [TL;DR](#tldr-example)

### Browser Support

Chrome 32+

By using the recommended [ES6 Promise polyfill](https://github.com/jakearchibald/ES6-Promises), browser support can be extended to: **Chrome 18+, Firefox 14+, Safari 6+, Opera 15+, and IE 11+**.

*If you are only [```fetch()```](#fetch)'ing and/or [```poll()```](#pollselector)'ing, or are using a MutationObserver polyfill, then Internet Explorer support can be extended to IE 9+*. 

**For mobile browser support see**:

 * http://caniuse.com/mutationobserver
 * http://caniuse.com/promises

### How To Load Gister

Gister can be loaded as an AMD module or a traditional (blocking) ```<script>``` tag.

#### As an AMD Module
 ```javascript
/*
 * Some module definition that has Gister as a dependency.
 * 
 * NOTE: A Promise polyfill must be loaded prior to the module executing.
 * Most likely you've handled this dependency in the RequireJS configuration,
 * or you just load the polyfill globally with a <script> tag.
 */
define([
  '...', // Just implies other dependencies, not to be confused with ES6 (Harmony) Spread
  'promise',
  'gister'
], function(..., Promise, Gister) {
   
   ...
   
   // If using Gister with dynamic (ajax) content
   new Gister('gist-id').observe('body');
   // Otherwise update the DOM with Gists immediately
   new Gister('gist-id').fetch();

});
```
#### As an HTML &lt;script&gt; Tag (creates a global window.Gister)

```html
<script src="http://s3.amazonaws.com/es6-promises/promise-0.1.1.min.js"></script>
<script src="gister.js" data-attrName="gist-id"></script>
<!-- 
   You can use any value for data-attrName, "gist-id" is just
   one example. If you want to control when the Gists are added,
   drop the data-attrName and do this:
-->
<script src="gister.js"></script>
<script>
  new Gister('gist-id').fetch();
</script>
```
### How to Use Gister

Gister requires your HTML content to contain ```<code>``` elements (with an HTML5 ```data-*``` attribute) where you want your Gist(s) to appear. For example:

```html
<!-- NOTE: "gist-id" can be any value you want, this is just one example -->
<p> ... lorem ipsum ... </p>
<code data-gist-id="{your public gist id}"></code>
<p> ... blah blah ... </p>
```
Once thats in place, use the **Gister API** to embed your Gists into your content's ```<code data-gist-id="123"></code>``` elements, or if it's static content load Gister like this: ```<script src="gister.js" data-attrName="gist-id"></script>```.
### Gister API

The Gister API is a constructor and set of public methods for a Gister object. Gister uses MutationObserver internally so the API has a similiar syntax and behavior.  The first step is to always construct a Gister object:

#### ```Gister(dataAttrName, [callback])``` 

Creates a new instance of Gister.

 ```dataAttrName``` is required. For example, ```<code data-dataAttrName="12345">```.

```callback``` is an optional function to execute for each Gist *after* it has been embedded into the parent ```<code>``` element. The ```callback``` will be passed a reference to the Gist's parent ```<code>``` element.

#### ```observe(selector)```

***Use with dynamic content***

Uses MutationObserver to observe a DOM node for changes. This is how you tell Gister to embed Gists into your dynamic content.

```selector``` is a CSS style selector targeting the DOM node that will contain the dynamic content. The node that ```selector``` targets must be present in the DOM prior to loading the dynamic content. It can be as general as targeting the ```<body>```element.


#### ```poll(selector)```

***Use with dynamic ontent***

If you don't want to use MutationObserver, or your browser doesn't support it, you can use ```poll``` to poll the DOM for changes to the element targeted by ```selector```. ```poll``` only polls the DOM for 10 seconds, so you should use it right before fetching your dynamic content.

```selector``` is a CSS style selector targeting the DOM node that will contain the dynamic content. The node that ```selector``` targets must be present in the DOM prior to loading the dynamic content. It can be as general as targeting the ```<body>```element.

#### ```fetch()```

If you don't need to use Gister with dynamic (Ajax) content, then you can use ```fetch()``` to immediately update the DOM with your Gists. ```fetch()``` is used behind the scenes for you when you load Gister with an inline ```<script data-attrName>``` element.

### TL;DR Example
If you don't need Gister for dynamic (Ajax) content, just use an inline ```<script>```, or Gister's ```fetch()``` method:

```html
<!-- Assuming Gists go in these elements: <code data-gist-id={YOUR GIST ID}></code> -->
<script src='gister.js' data-attrName='gist-id'></script>
<!-- ... Or ... -->
<script src='gister.js'></script>
<script>
  new Gister('gist-id').fetch();
</script>
```

If using the Gister API (for example on dynamic content or in a module definition):
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
  doAjax().thenPutResponseIn('#post-container');
} else if(window.Promise) {
  // You can use poll() where MutationObserver isn't supported.
  new Gister('gist-id').poll('#post-container');
  // Now fetch the content and insert it into the DOM node targeted by #post-container.
  doAjax().thenPutResponseIn('#post-container');
} else {
  // You probably shouldn't use Gister (as-is) to load your Gists.
}
```

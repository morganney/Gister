/**
 * Gister provides dynamic embedding of GitHub Gists using MutationObservers and Promises.
 * It can be loaded as an AMD module or inline script element.
 *
 * Gister embeds gist content into HTML5 code elements with a data-* attribute:
 * <code data-publicGistId='12345'>
 *
 * Gister also works without MutationObservers on static content if loaded via an inline
 * script tag using a data-attrName attribute:
 * <script data-attrName='foobar' src='gister.js'></script> (updates) <code data-foobar='[public gist id]'></code>
 *
 * WARNING: This script isn't cross-browser in any way. In particular, it doesn't
 * cater to Internet Explorer's inabilities, and only supports the latest versions
 * of modern browsers that implement the MutationObserver and Promise API's.
 *
 *********************************************************************************************
 *  This basically means that only Chrome 32+ supports Gister by default (as of 1/28/2014).  *
 *********************************************************************************************
 *
 * By adding the suggested Promise polyfill, the script can support
 * Chrome 18+, Firefox 14+, Safari 6+, Opera 15+, and IE 11+.
 *
 * If you want better browser support, in particular for IE, or you want Gister to
 * be more configurable, fork me.
 *
 * For mobile browser support @see http://caniuse.com/
 *
 * Recommended Promises polyfill: @see https://github.com/jakearchibald/ES6-Promises
 */
(function(root, modef, undefined) {

  var inlineScript = undefined;

  if(typeof define === 'function' && define.amd) {
    define(modef); // AMD
  } else {
    root.Gister = modef(); // <script>

    // If <script data-attrName> used, bypass MutationObserver API and update DOM immediately.
    inlineScript = document.querySelector('script[src*="gister"]');
    if(inlineScript && inlineScript.dataset.attrName) {
      new root.Gister(inlineScript.dataset.attrName).fetch();
    }
  }

}(this, function() {
  /**
   * Constructor for Gister. The dataAttrName parameter is required as the data attribute name value
   * of the DOM node where the gist is to be embedded.
   * @example
   * 	If gist's parent node is <code data-gistId='12345'> then dataAttrName === 'gistId'
   *	If gist's parent node is <code data-foo-bar='12345'> then dataAttrName === 'foo-bar'
   *
   * @param {String:dataAttrName(req)} The name of the gist's parent node's data attribute. Required.
   * @param {Function:callback} Optional callback to be called after each gist is embedded.
   */
  var	Gister = function(dataAttrName, callback) {

    // Check for Promise support. Gister requires ES6 Promises.
    if(!window.Promise) {
      throw new Error("Failed to construct 'Gister': 'Promise' is not defined.");
    }

    // Enforce constructor invocation.
    if(!(this instanceof Gister)) {
      throw new TypeError("Failed to construct 'Gister': Use the 'new' operator.");
    }

    // Enforce parameter requirement.
    if(!dataAttrName) {
      throw new Error("Failed to construct 'Gister': Provide a data attr. name for the gist container(s).");
    }

    // Private properties and/or methods.
    var w = window, d = document, me = this,
      gistSelector = ['code[data-', dataAttrName, ']'].join(''),
      // Convert hyphens "-" into camelCase.
      dataSetName = dataAttrName.replace(/-([a-z])/g, function(l) {return l[1].toUpperCase();}),
      addGistCss = function(filename) {
        var link = d.createElement('link'),
          fn   = filename.indexOf('http') > -1 ? filename : 'https://gist-assets.github.com' + filename;

        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.media = 'all';
        link.href = fn;

        d.getElementsByTagName('head')[0].appendChild(link);
        // Only need to append the CSS stylesheet once.
        addGistCss = function() {};
      },
      mutationCallback = function() {
        // Convert NodeList into an Array of Nodes. Older versions of IE throw and error here.
        Array.prototype.slice.call(d.querySelectorAll(gistSelector)).forEach(function(el) {
          fetch(el.dataset[dataSetName]).then(function(gist) {
            addGistCss(gist.stylesheet);
            el.innerHTML = gist.div;
            el.className = el.className + ' gisterComplete';
          }).catch(function(error) {
            el.className = el.className + ' gisterError';
            el.innerHTML = error.message;
          }).then(function() {
            // Always execute a user supplied callback. Usually for adding/removing CSS styles.
            if(callback && typeof callback === 'function') callback(el);
          });
        });
        // Just listen once.
        observer.disconnect();
      },
      observer = w.MutationObserver ? new MutationObserver(mutationCallback) : undefined;

    /**
     * Private function for fetching a GitHub gist. Uses JSONP because gists.github.com
     * doesn't support CORS (api.github.com supports CORS but is rate-limited).
     *
     * Returns a Promise object.
     *
     * @param {String:id} The public gist id.
     * @returns {Object} A Promise of a gist.
     */
    function fetch(id) {
      return new Promise(function(resolve, reject) {
        var s = d.createElement('script'),
          first = d.getElementsByTagName('script')[0],
          callbackName = '_f_gist' + id,
          gistName = '_p_gist' + id,
          overwritten = typeof w[callbackName] !== 'undefined' ? true : false,
          preserved = w[callbackName],
          cleanup = function() {
            if(overwritten) w[callbackName] = preserved;
            else delete w[callbackName];
          };

        /**
         * The inserted script's JSONP callback. Attach it to global scope before appending script.
         *
         * @param {JSON:gist} Response from https://gists.github.com/{gist id}.json.
         */
        w[callbackName] = function(gist) {
          w[gistName] = gist;
          cleanup();
        };

        s.src = ['https://gist.github.com/', id, '.json?callback=', callbackName].join('');

        /**
         * The inserted script's onload handler.
         * Resolves the raw JSON gist from gists.github.com.
         */
        s.onload = function() {
          resolve(w[gistName]);
          delete w[gistName];
        };

        /**
         * The inserted script's onerror handler.
         * Rejects the promise with an Error object.
         */
        s.onerror = function() {
          reject(new Error('Unable to retrieve gist ' + id));
          cleanup();
        };

        /**
         * Add a timeout in case GitHub is busy or some other unknown network issue is afoot.
         * Rejects the promise if GitHub takes 10 seconds to respond.
         *
         * Once a Promise is fulfilled or rejected, it will NEVER change its state again, so
         * rejecting after some set time won't overwrite any previous fulfillment or rejection.
         */
        setTimeout(function() {
          reject(new Error('The request to GitHub has timed out.'));
          // Bypass cleanup() to avoid any runtime errors from a missing function reference.
        }, 10000);

        // Add the <script> to the DOM
        first.parentNode.insertBefore(s, first);
      });
    }

    // Protected properties and/or methods

    /**
     * Observes a DOM node for changes prior to embedding GitHub gists.
     * Uses MutationObserver's observe() method.
     *
     * NOTE: The node identified by 'selector' must already be in the DOM prior to calling.
     *
     * @param {String:selector} A Selectors API (Level 2) string identifying the gists parent node in the DOM.
     */
    this.observe = function(selector) {
      if(!observer) throw new Error("Your browser doesn't support 'MutationObserver'.");
      else observer.observe(d.querySelector(selector), { childList: true });
    };

    /**
     * Polls the DOM node targed by 'selector' for gist parent nodes (containers).
     * This is a fallback for browser's with Promise support but no MutationObserver support.
     * Really only useful for slightly older versions of IE.
     *
     * Will only poll the DOM for 10 seconds, so call this method at around the time
     * you expect the DOM to change.
     *
     * @param {String:selector} A Selectors API (Level 2) string identifying the gists parent node in the DOM.
     */
    this.poll = function(selector) {
      var node = document.querySelector(selector),
        start = new Date().getTime(),
        timer = undefined;

      (function recurse() {
        var elapsed = (new Date().getTime()) - start;

        if(elapsed >= 10 * 1000) { // Only poll the DOM for 10 seconds, no more.
          clearTimeout(timer);
        } else if(node.querySelectorAll(gistSelector).length) {
          clearTimeout(timer);
          mutationCallback(null);
        } else {
          timer = setTimeout(recurse, 500); // Poll the DOM twice a second.
        }
      }());

    };

    /**
     * Wrapper for Gister's private mutationCallback handler.
     * Allows Gister to be used without MutationObservers for static content.
     */
    this.fetch = function() {
      mutationCallback();
    };

  };

  // Return the module definition.
  return Gister;
}));
/**
 * Gister provides dynamic embedding of GitHub Gists using MutationObservers and Promises.
 * It can be loaded as an AMD module or inline script element.
 *
 * Gister embeds gist content into HTML5 code elements with a data-* attribute:
 * E.g.: <code data-publicGistId='12345'>.
 *
 * WARNING: This script isn't cross-browser in any way. In particular, it doesn't
 * cater to Internet Explorer's inabilities, and only supports the latest versions
 * of modern browsers that implement the MutationObserver and Promise API's.
 *
 ******************************************************************************************
 *  This basically means that only Chrome 32+ is supported by default (as of 1/28/2014).  *
 ******************************************************************************************
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
(function(root, modef) {

  if(typeof define === 'function' && define.amd) {
    define(modef); // AMD
  } else {
    root.Gister = modef(); // <script>
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
  var	Gister = function(dataAttrName, callback) {// e.g. <p data-foo-bar='baz'> dataAttrName == "foo-bar"

    // Private properties and/or methods.
    var w = window, d = document, me = this,
        gistSelector = ['code[data-', dataAttrName, ']'].join(''),
        // Convert hyphens "-" into camelCase.
        dataSetName = dataAttrName.replace(/-([a-z])/g, function (g) {return g[1].toUpperCase();}),
        addGistCss = function(filename) {
          var link = d.createElement('link');

          link.type = 'text/css';
          link.rel = 'stylesheet';
          link.media = 'all';
          link.href = 'https://gist.github.com' + filename;

          d.getElementsByTagName('head')[0].appendChild(link);
          // Only need to append the CSS stylesheet once.
          addGistCss = function() {};
        },
        mutationCallback = function(mutations) {
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
         * Rejects the promise if GitHub takes 8 seconds to respond.
         *
         * Once a Promise is fulfilled or rejected, it will NEVER change its state again, so
         * rejecting after some set time won't overwrite any previous fulfillment or rejection.
         */
        setTimeout(function() {
          reject(new Error('The request to GitHub has timed out.'));
          // Bypass cleanup() to avoid any runtime errors from a missing function reference.
        }, 8000);

        // Add the <script> to the DOM
        first.parentNode.insertBefore(s, first);
      });
    }

    // Enforce constructor invocation.
    if(!(this instanceof Gister)) {
      throw new TypeError("Failed to construct 'Gister': Use the 'new' operator.");
    }

    // Enforce parameter requirement.
    if(!dataAttrName) {
      throw new Error("Failed to construct 'Gister': Provide a data attr. name for the gist container(s).");
    }

    // Check for Promise support. The use of Promises should be encouraged for async applications.
    if(!w.Promise) {
      throw new Error("Failed to construct 'Gister': Your browser doesn't support 'Promise'.");
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
      else observer.observe(d.querySelector(selector), { childList: true});
    };

    /**
     * Polls the DOM node targed by 'selector' for gist parent nodes (containers).
     * This is a fallback for browser's with Promise support but no MutationObserver support.
     * Really only useful for slightly older versions of IE.
     *
     * Will only poll the DOM for 8 seconds, so call this method at around the time
     * you expect the DOM to change.
     *
     * @param {String:selector} A Selectors API (Level 2) string identifying the gists parent node in the DOM.
     */
    this.poll = function(selector) {
      var node = document.querySelector(selector),
          start = new Date().getTime(),
          timer = undefined;

      console.log('Starting DOM polling ...');
      (function recurse() {
        var elapsed = (new Date().getTime()) - start;

        if(elapsed >= 8 * 1000) { // Only poll the DOM for 8 seconds, no more.
          console.log('Polling timed out.');
          clearTimeout(timer);
        } else if(node.querySelectorAll(gistSelector).length) {
          console.log('Stopping DOM polling.');
          clearTimeout(timer);
          mutationCallback(null);
        } else {
          console.log('Polling recurse.');
          timer = setTimeout(recurse, 500); // Poll the DOM twice a second.
        }
      }());
    };

  };

  // Return the module definition.
  return Gister;
}));

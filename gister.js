/**
* Gister provides dynamic embedding of GitHub Gists using MutationObservers and
* Promises. It can be loaded as a module (CommonJS/AMD) or <script>.
*
* Gister embeds gist content into HTML5 code elements with a data-* attribute:
* <code data-publicGistId='12345'>
*
* Gister also works without MutationObservers on static (server-generated)
* content if loaded as a <script> with a set data-attrName property:
* e.g. <script data-attrName='gist' src='gister.js'></script> will update
* <code data-gist='[public gist id]'></code> elements on page load.
*
* WARNING: Gister is only supported by modern browsers that implement Promises.
*
*/
(function(root, modef, undefined) {
  var inlineScript = undefined;

  // CommonJs
  if(typeof module !== 'undefined' && module.exports) module.exports = modef();
  // AMD
  else if(typeof define === 'function' && define.amd) define(modef);
  // <script>
  else {
    root.Gister = modef();

    // update inline scripts with data-attrName immediately
    inlineScript = document.querySelector('script[src*="gister"');
    if(inlineScript && inlineScript.dataset.attrName) {
      new root.Gister(inlineScript.dataset.attrName).fetch();
    }
  }
}(this, function() {
  /**
   * Constructor for Gister.
   * @example
   * 	For gists embedded into:
   *    <code data-gistId='12345'> then dataAttrName === 'gistId'
   *    <code data-foo-bar='12345'> then dataAttrName === 'foo-bar'
   *
   * @param {String:dataAttrName(req)} Required
   * @param {Function:callback} Optional callback invoked after embedding gist
   */
   var Gister = function(dataAttrName, callback) {

    // Private properties and/or methods.
    var w = window;
    var d = document;
    var me = this;
    var gistSelector = ['code[data-', dataAttrName, ']'].join('');
    var dataSetName = dataAttrName.replace(/-([a-z])/g, function(g) {return g[1].toUpperCase();});
    var addGistCss = function(filename) {
      var link = d.createElement('link');
      var fn = filename.indexOf('http') > -1 ? filename : 'https://gist-assets.github.com' + filename;

      link.type = 'text/css';
      link.rel = 'stylesheet';
      link.media = 'all';
      link.href = fn;

      d.getElementsByTagName('head')[0].appendChild(link);
      // Only need to append the CSS stylesheet once.
      addGistCss = function() {};
    };
    var mutationCallback = function(mutations) {
      var gistNodes = Array.prototype.slice.call(d.querySelectorAll(gistSelector));

      gistNodes.forEach(function(el) {
        fetch(el.dataset[dataSetName]).then(function(gist) {
          addGistCss(gist.stylesheet);
          el.innerHTML = gist.div;
          el.className = el.className + ' gisterComplete';
        }).catch(function(error) {
          el.className = el.className + ' gisterError';
          el.innerHTML = error.message;
        }).then(function() {
          if(callback && typeof callback === 'function') callback(el);
        });
      });

      // Just listen once.
      observer.disconnect();
    };
    var observer = w.MutationObserver ? new MutationObserver(mutationCallback) : undefined;

    /**
     * Private function for fetching a GitHub gist using JSONP.
     *
     * @param {String:id} The public gist id.
     * @returns {Object} A Promise of a gist.
     */
    function fetch(id) {
      return new Promise(function(resolve, reject) {
        var s = d.createElement('script');
        var first = d.getElementsByTagName('script')[0];
        var callbackName = '_f_gist' + id;
        var gistName = '_p_gist' + id;
        var overwritten = typeof w[callbackName] !== 'undefined' ? true : false;
        var preserved = w[callbackName];
        var cleanup = function() {
          if(overwritten) w[callbackName] = preserved;
          else delete w[callbackName];
        };

        /**
         * The inserted script's JSONP callback.
         *
         * @param {JSON:gist}
         */
        w[callbackName] = function(gist) {
          w[gistName] = gist;
          cleanup();
        };

        s.src = ['https://gist.github.com/', id, '.json?callback=', callbackName].join('');

        /**
         * The inserted script's onload handler.
         * Resolves the raw JSON gist.
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
         * Add a timeout to defend against unkown network issues.
         * Rejects the promise if GitHub takes 10 seconds to respond.
         *
         * Once a Promise is fulfilled or rejected its state won't change so
         * rejecting after some set time won't overwrite any previous state.
         */
        setTimeout(function() {
          reject(new Error('The request to GitHub has timed out.'));
          // Bypass cleanup() to avoid any errors from a missing function reference.
        }, 10000);

        // Add the <script> to the DOM
        first.parentNode.insertBefore(s, first);
      });
    }

    if(!(this instanceof Gister)) {
      throw new TypeError("Failed to construct 'Gister': Use the 'new' operator.");
    }

    if(!dataAttrName) {
      throw new Error("Failed to construct 'Gister': Provide a data attr. name for the gist container(s).");
    }

    if(!w.Promise) {
      throw new Error("Failed to construct 'Gister': Your browser doesn't support 'Promise'.");
    }

    // Protected properties and/or methods

    /**
     * Observes a DOM node for changes prior to embedding GitHub gists.
     * Uses MutationObserver's observe() method.
     *
     * NOTE: The node identified by 'selector' must be present in the DOM.
     *
     * @param {String:selector} A Selectors API (Level 2) string
     */
    this.observe = function(selector) {
      if(!observer) throw new Error("Your browser doesn't support 'MutationObserver'.");
      else observer.observe(d.querySelector(selector), { childList: true });
    };

    /**
     * Polls the DOM tree under 'selector' for gist containers for 10 seconds.
     * This is a fallback for browser's without MutationObserver support.
     *
     * @param {String:selector} A Selectors API (Level 2) string
     */
    this.poll = function(selector) {
      var node = document.querySelector(selector);
      var start = new Date().getTime();
      var timer = undefined;

      (function recurse() {
        var elapsed = (new Date().getTime()) - start;

        if(elapsed >= 10 * 1000) {
          clearTimeout(timer);
        } else if(node.querySelectorAll(gistSelector).length) {
          clearTimeout(timer);
          mutationCallback(null);
        } else {
          timer = setTimeout(recurse, 500);
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

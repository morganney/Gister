mocha.setup('bdd');

require.config({
  baseUrl: '.',
  paths: {
    gister: '../gister'
  }
});

require(['gister'], function(Gister) {

  describe('Gister', function() {

    this.timeout(5000);

    it('Should be defined globally when used with an inline <script> tag', function() {
      window.Gister.should.be.an.instanceof(Object).and.should.not.be.exactly(Gister);
    });

    it('Should support AMD loading', function() {
      Gister.should.be.an.instanceof(Object).and.should.not.be.exactly(window.Gister);
    });

    if(typeof Promise === 'function') {
      describe('Constructor', function() {

        it('Should check for ES6 Promise support', function() {
          (function() {
            new Gister('test')
          }).should.not.throw();
        });

        it("Should require use of the 'new' operator", function() {
          (function() {
            var gister = Gister('test');
          }).should.throw(/use\ the\ \'new\'\ operator/i);
        });

        it('Should require a String as the first argument', function() {
          (function() {
            new Gister();
          }).should.throw(/provide\ a\ data\ attr\.\ name/i);
        });

        it('Should accept a Function as the second argument', function() {
          (function() {
            new Gister('test', function(el) {/* 'el' is the <code> node that was just updated */ });
          }).should.not.throw();
        });

      });

      describe('#fetch', function() {

        afterEach(function() {
          $('#fixtures').empty();
        });

        it('Should update targeted <code> elements already present in the DOM', function(done) {
          $('#fixtures').append("<code data-gist-id='11103140' id='targeted'></code>");
          new Gister('gist-id', function(el) {
            el.className.should.match(/gisterComplete/);
            el.innerHTML.should.not.be.empty;
            done();
          }).fetch();
        });

        it('Should execute any callback function passed to Gister Constructor', function(done) {
          $('#fixtures').append("<code data-gist-id='11103140' id='targeted'></code>");
          new Gister('gist-id', function() { done() }).fetch();
        });
      });

      describe('#observe', function() {

        beforeEach(function() {
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function() {
          $('#fixtures').empty();
          this.clock.restore();
        });

        it('Should update any targeted, children <code> elements of the observed DOM node after it undergoes a mutation', function(done) {
          $('#fixtures').append("<div id='observed'></div>");
          new Gister('gist-id', function(el) {
            el.className.should.match(/gisterComplete/);
            el.innerHTML.should.not.be.empty;
            done();
          }).observe('#observed');
          setTimeout(function() { $('#observed').append("<code data-gist-id='11106519' id='targeted'></code>") }, 2000);
          this.clock.tick(2000);
        });

        it('Should execute any callback function passed to Gister Constructor', function(done) {
          $('#fixtures').append("<div id='observed'></div>");
          new Gister('gist-id', function() { done() }).observe('#observed');
          setTimeout(function() { $('#observed').append("<code data-gist-id='11106519' id='targeted'></code>") }, 2000);
          this.clock.tick(2000);
        });
      });

      describe('#poll', function() {

        beforeEach(function() {
          this.clock = sinon.useFakeTimers();
        });

        afterEach(function() {
          //$('#fixtures').empty();
          this.clock.restore();
        });

        it('Should update any targeted, children <code> elements of the polled DOM node after it undergoes a mutation', function(done) {
          $('#fixtures').append("<div id='polled'></div>");
          new Gister('gist-id', function(el) {
            el.className.should.match(/gisterComplete/);
            el.innerHTML.should.not.be.empty;
            done();
            $('#fixtures').empty();
          }).poll('#polled');
          setTimeout(function() { $('#polled').append("<code data-gist-id='11120666' id='targeted'></code>") }, 2000);
          this.clock.tick(2000);
        });

        it('Should execute any callback function passed to Gister Constructor', function(done) {
          $('#fixtures').append("<div id='polled'></div>");
          new Gister('gist-id', function() { done(); $('#fixtures').empty(); }).poll('#polled');
          setTimeout(function() { $('#polled').append("<code data-gist-id='11120666' id='targeted'></code>") }, 2000);
          this.clock.tick(2000);
        });

        it('Should not poll the DOM node for more than 10 seconds', function(done) {
          var targeted = undefined
            , cb       = sinon.spy()
            , me       = this
          ;

          $('#fixtures').append("<div id='polled'></div>");
          new Gister('gist-id', cb).poll('#polled');

          // Wait 10 (fake) seconds before upating polled DOM node
          setTimeout(function() {
            $('#polled').append("<code data-gist-id='11120666' id='targeted'></code>");
            // Now wait 5 (fake) seconds for any network activity to occur
            setTimeout(function() {
              targeted = document.querySelector('code#targeted');
              console.dir(targeted); // TODO: if outer timeout set to 1s, tests still pass! Why?!
              cb.callCount.should.be.exactly(0);
              targeted.className.should.not.match(/gisterComplete/);
              targeted.innerHTML.should.be.empty;
              done();
            }, 5000);
            me.clock.tick(5000);
          }, 10000);
          this.clock.tick(10000);
        });
      });
    } else {
      it('Should undergo limited testing when ES6 Promise dependency is NOT met', function() { true });

      describe('#Constructor', function() {
        it('Should require ES6 Promises to be available', function() {
          (function() {
            new Gister('test');
          }).should.throw(/\'promise\'\ is\ not\ defined/i);
        });
      });
    }
  });

  // Start mocha ignoring globals (Gister uses dynamic globals for JSONP callbacks)
  mocha.setup({ ignoreLeaks: true }).run();
});
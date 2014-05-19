mocha.setup('bdd');

require.config({
  baseUrl: '.',
  paths: {
    gister: '../gister'
  }
});

require(['gister'], function(Gister) {

  describe('Gister', function() {

    it('Should be defined globally when used with an inline <script> tag', function() {
      window.Gister.should.be.an.instanceof(Object).and.should.not.be.exactly(Gister);
    });

    it('Should support AMD loading', function() {
      Gister.should.be.an.instanceof(Object).and.should.not.be.exactly(window.Gister);
    });

    if(typeof Promise === 'function') {
      describe('#Constructor', function() {

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
            var gister = new Gister();
          }).should.throw(/provide\ a\ data\ attr\.\ name/i);
        });

      });
    } else {
      it('Should not be tested further until ES6 Promise dependency met', function() {
        true;
      });

      describe('#Constructor', function() {
        it('Should require ES6 Promises to be available', function() {
          (function() {
            new Gister('test');
          }).should.throw(/\'promise\'\ is\ not\ defined/i);
        });
      });
    }
  });

  mocha.checkLeaks();
  mocha.globals(['jQuery']);
  mocha.run();
});
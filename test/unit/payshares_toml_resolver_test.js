import http from "http";

describe("payshares_toml_resolver.js tests", function () {
  beforeEach(function () {
    this.axiosMock = sinon.mock(axios);
    PaysharesSdk.Config.setDefault();
  });

  afterEach(function () {
    this.axiosMock.verify();
    this.axiosMock.restore();
  });

  describe('PaysharesTomlResolver.resolve', function () {
    it("returns payshares.toml object for valid request and payshares.toml file", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.payshares.org/federation"
`
        }));

      PaysharesSdk.PaysharesTomlResolver.resolve('acme.com')
        .then(paysharesToml => {
          expect(paysharesToml.FEDERATION_SERVER).equals('https://api.payshares.org/federation');
          done();
        });
    });

    it("returns payshares.toml object for valid request and payshares.toml file when allowHttp is `true`", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('http://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="http://api.payshares.org/federation"
`
        }));

      PaysharesSdk.PaysharesTomlResolver.resolve('acme.com', {allowHttp: true})
        .then(paysharesToml => {
          expect(paysharesToml.FEDERATION_SERVER).equals('http://api.payshares.org/federation');
          done();
        });
    });

    it("returns payshares.toml object for valid request and payshares.toml file when global Config.allowHttp flag is set", function (done) {
      PaysharesSdk.Config.setAllowHttp(true);

      this.axiosMock.expects('get')
        .withArgs(sinon.match('http://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="http://api.payshares.org/federation"
`
        }));

      PaysharesSdk.PaysharesTomlResolver.resolve('acme.com')
        .then(paysharesToml => {
          expect(paysharesToml.FEDERATION_SERVER).equals('http://api.payshares.org/federation');
          done();
        });
    });

    it("rejects when payshares.toml file is invalid", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
/#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.payshares.org/federation"
`
        }));

      PaysharesSdk.PaysharesTomlResolver.resolve('acme.com').should.be.rejectedWith(/Parsing error on line/).and.notify(done);
    });

    it("rejects when there was a connection error", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com/.well-known/payshares.toml'))
        .returns(Promise.reject());

      PaysharesSdk.PaysharesTomlResolver.resolve('acme.com').should.be.rejected.and.notify(done);
    });

    it("fails when response exceeds the limit", function (done) {
      // Unable to create temp server in a browser
      if (typeof window != 'undefined') {
        return done();
      }
      var response = Array(PaysharesSdk.PAYSHARES_TOML_MAX_SIZE+10).join('a');
      let tempServer = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'text/x-toml; charset=UTF-8');
        res.end(response);
      }).listen(4444, () => {
        PaysharesSdk.PaysharesTomlResolver.resolve("localhost:4444", {allowHttp: true})
          .should.be.rejectedWith(/payshares.toml file exceeds allowed size of [0-9]+/)
          .notify(done)
          .then(() => tempServer.close());
      });
    });
  });
});

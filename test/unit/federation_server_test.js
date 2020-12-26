import http from "http";

describe("federation-server.js tests", function () {
  beforeEach(function () {
    this.server = new PaysharesSdk.FederationServer('https://acme.com:1337/federation', 'payshares.org');
    this.axiosMock = sinon.mock(axios);
    PaysharesSdk.Config.setDefault();
  });

  afterEach(function () {
    this.axiosMock.verify();
    this.axiosMock.restore();
  });

  describe('FederationServer.constructor', function () {
    it("throws error for insecure server", function () {
      expect(() => new PaysharesSdk.FederationServer('http://acme.com:1337/federation', 'payshares.org')).to.throw(/Cannot connect to insecure federation server/);
    });

    it("allow insecure server when opts.allowHttp flag is set", function () {
      expect(() => new PaysharesSdk.FederationServer('http://acme.com:1337/federation', 'payshares.org', {allowHttp: true})).to.not.throw();
    });

    it("allow insecure server when global Config.allowHttp flag is set", function () {
      PaysharesSdk.Config.setAllowHttp(true);
      expect(() => new PaysharesSdk.FederationServer('http://acme.com:1337/federation', 'payshares.org', {allowHttp: true})).to.not.throw();
    });
  });

  describe('FederationServer.resolveAddress', function () {
    beforeEach(function () {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com:1337/federation?type=name&q=bob%2Apayshares.org'))
        .returns(Promise.resolve({
          data: {
            payshares_address: 'bob*payshares.org',
            account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS'
          }
        }));
    });

    it("requests is correct", function (done) {
      this.server.resolveAddress('bob*payshares.org')
        .then(response => {
          expect(response.payshares_address).equals('bob*payshares.org');
          expect(response.account_id).equals('GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });

    it("requests is correct for username as payshares address", function (done) {
      this.server.resolveAddress('bob')
        .then(response => {
          expect(response.payshares_address).equals('bob*payshares.org');
          expect(response.account_id).equals('GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe('FederationServer.resolveAccountId', function () {
    beforeEach(function () {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com:1337/federation?type=id&q=GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS'))
        .returns(Promise.resolve({
          data: {
            payshares_address: 'bob*payshares.org',
            account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS'
          }
        }));
    });

    it("requests is correct", function (done) {
      this.server.resolveAccountId('GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS')
        .then(response => {
          expect(response.payshares_address).equals('bob*payshares.org');
          expect(response.account_id).equals('GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe('FederationServer.resolveTransactionId', function () {
    beforeEach(function () {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com:1337/federation?type=txid&q=3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889'))
        .returns(Promise.resolve({
          data: {
            payshares_address: 'bob*payshares.org',
            account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS'
          }
        }));
    });

    it("requests is correct", function (done) {
      this.server.resolveTransactionId('3389e9f0f1a65f19736cacf544c2e825313e8447f569233bb8db39aa607c8889')
        .then(response => {
          expect(response.payshares_address).equals('bob*payshares.org');
          expect(response.account_id).equals('GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS');
          done();
        })
        .catch(function (err) {
          done(err);
        });
    });
  });

  describe('FederationServer.createForDomain', function () {
    it("creates correct object", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.payshares.org/federation"
`
        }));

      PaysharesSdk.FederationServer.createForDomain('acme.com')
        .then(federationServer => {
          expect(federationServer.serverURL.protocol()).equals('https');
          expect(federationServer.serverURL.hostname()).equals('api.payshares.org');
          expect(federationServer.serverURL.path()).equals('/federation');
          expect(federationServer.domain).equals('acme.com');
          done();
        });
    });

    it("fails when payshares.toml does not contain federation server info", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: ''
        }));

      PaysharesSdk.FederationServer.createForDomain('acme.com').should.be.rejectedWith(/payshares.toml does not contain FEDERATION_SERVER field/).and.notify(done);
    });
  });

  describe('FederationServer.resolve', function () {
    it("succeeds for a valid account ID", function (done) {
      PaysharesSdk.FederationServer.resolve('GAFSZ3VPBC2H2DVKCEWLN3PQWZW6BVDMFROWJUDAJ3KWSOKQIJ4R5W4J')
        .should.eventually.deep.equal({account_id: 'GAFSZ3VPBC2H2DVKCEWLN3PQWZW6BVDMFROWJUDAJ3KWSOKQIJ4R5W4J'})
        .notify(done);
    });

    it("fails for invalid account ID", function (done) {
      PaysharesSdk.FederationServer.resolve('invalid').should.be.rejectedWith(/Invalid Account ID/).notify(done);
    });

    it("succeeds for a valid Payshares address", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://payshares.org/.well-known/payshares.toml'))
        .returns(Promise.resolve({
          data: `
#   The endpoint which clients should query to resolve payshares addresses
#   for users on your domain.
FEDERATION_SERVER="https://api.payshares.org/federation"
`
        }));

      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://api.payshares.org/federation?type=name&q=bob%2Apayshares.org'))
        .returns(Promise.resolve({
          data: {
            payshares_address: 'bob*payshares.org',
            account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS',
            memo_type: 'id',
            memo: '100'
          }
        }));

      PaysharesSdk.FederationServer.resolve('bob*payshares.org')
        .should.eventually.deep.equal({
          payshares_address: 'bob*payshares.org',
          account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS',
          memo_type: 'id',
          memo: '100'
        })
        .notify(done);
    });

    it("fails for invalid Payshares address", function (done) {
      PaysharesSdk.FederationServer.resolve('bob*payshares.org*test').should.be.rejectedWith(/Invalid Payshares address/).notify(done);
    });

    it("fails when memo is not string", function (done) {
      this.axiosMock.expects('get')
        .withArgs(sinon.match('https://acme.com:1337/federation?type=name&q=bob%2Apayshares.org'))
        .returns(Promise.resolve({
          data: {
            payshares_address: 'bob*payshares.org',
            account_id: 'GB5XVAABEQMY63WTHDQ5RXADGYF345VWMNPTN2GFUDZT57D57ZQTJ7PS',
            memo_type: 'id',
            memo: 100
          }
        }));

      this.server.resolveAddress('bob*payshares.org')
        .should.be.rejectedWith(/memo value should be of type string/).notify(done);
    });

    it("fails when response exceeds the limit", function (done) {
      // Unable to create temp server in a browser
      if (typeof window != 'undefined') {
        return done();
      }
      var response = Array(PaysharesSdk.FEDERATION_RESPONSE_MAX_SIZE+10).join('a');
      let tempServer = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        res.end(response);
      }).listen(4444, () => {
        new PaysharesSdk.FederationServer('http://localhost:4444/federation', 'payshares.org', {allowHttp: true})
          .resolveAddress('bob*payshares.org')
          .should.be.rejectedWith(/federation response exceeds allowed size of [0-9]+/)
          .notify(done)
          .then(() => tempServer.close());
      });
    });
  });
});

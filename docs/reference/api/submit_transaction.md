---
title: submitTransaction()
---

## Overview

You can build a transaction locally (see [this example](../readme.md#building-transactions)), but after you build it you have to submit it to the Payshares network.  js-payshares-sdk has a function `submitTransaction()` that sends your transaction to the Horizon server (via the [`transactions_create`](https://payshares.org/developers/horizon/reference/transactions-create.html) endpoint) to be broadcast to the Payshares network.

## Methods

| Method | Horizon Endpoint | Param Type | Description |
| --- | --- | --- | --- |
| `submitTransaction(Transaction)` | [`transactions_create`](https://payshares.org/developers/horizon/reference/transactions-create.html) |  [`Transaction`](https://github.com/payshares/js-payshares-base/blob/master/src/transaction.js) | Submits a transaction to the network.

## Example

```js
var PaysharesSdk = require('js-payshares-sdk')
var server = new PaysharesSdk.Server('https://horizon-testnet.payshares.org');

var transaction = new PaysharesSdk.TransactionBuilder(account)
        // this operation funds the new account with XPS
        .addOperation(PaysharesSdk.Operation.payment({
            destination: "GASOCNHNNLYFNMDJYQ3XFMI7BYHIOCFW3GJEOWRPEGK2TDPGTG2E5EDW",
            asset: PaysharesSdk.Asset.native(),
            amount: "20000000"
        }))
        .build();

transaction.sign(PaysharesSdk.Keypair.fromSeed(seedString)); // sign the transaction

server.submitTransaction(transaction)
    .then(function (transactionResult) {
        console.log(transactionResult);
    })
    .catch(function (err) {
        console.error(err);
    });
```

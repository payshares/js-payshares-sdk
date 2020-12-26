#!/bin/bash

set -e

cd ../../js-payshares-lib-gh-pages
git checkout -- .
git clean -dfx
git fetch
git rebase
rm -Rf *
cd ../js-payshares-lib/website
npm run-script docs
cp -R docs/* ../../js-payshares-lib-gh-pages/
rm -Rf docs/
cd ../../js-payshares-lib-gh-pages
git add --all
git commit -m "update website"
git push
cd ../js-payshares-lib/website
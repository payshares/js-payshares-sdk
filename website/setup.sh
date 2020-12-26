#!/bin/bash

cd ../../
if [ "$TRAVIS" ]; then
  git clone "https://payshares-jenkins@github.com/payshares/js-payshares-lib.git" js-payshares-lib-gh-pages
else
  git clone git@github.com:payshares/js-payshares-lib.git js-payshares-lib-gh-pages
fi
cd js-payshares-lib-gh-pages
git checkout origin/gh-pages
git checkout -b gh-pages
git branch --set-upstream-to=origin/gh-pages
cd ../js-payshares-lib/website

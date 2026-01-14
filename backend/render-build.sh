#!/usr/bin/env bash
# exit on error
set -o errexit

#install dependencies
npm install

#Ensure the Puppeteer cache directory exists
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

#install Puppeteer and download chrome
npx puppeteer browsers install chrome

#Store/pull Puppeteer cache with build cache
if [[ ! -d $PUPPETEER_CACHE_DIR]] ; then
    echo "...Copying Puppeteer Cache from Build Cache"
    #copying from the actual path where Puppeteer stores its chrome binary
    cp -R /opt/render/backend/.cache/puppeteer/chrome $PUPPETEER_CACHE_DIR
else
    echo "...Storing Puppeteer Cache in Build Cache"
    cp -R $PUPPETEER_CACHE_DIR /opt/render/backend/.cache/puppeteer/chrome
fi
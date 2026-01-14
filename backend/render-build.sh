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

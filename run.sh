#!/bin/sh

cd `dirname $0`
npm install
forever start app.js
forever start scripts/poll.js -d 60
forever list

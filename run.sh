#!/bin/sh

cd `dirname $0`
forever start app.js
forever start scripts/poll.js -d
forever list

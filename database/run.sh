#!/bin/bash

set -m

firebase emulators:start --export-on-exit=./backup --import=./backup &

cd ./functions
tsc --watch
cd ..

fg %1
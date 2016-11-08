#!/bin/bash

modprobe i2c-dev || true
modprobe bcm2835-v4l2 || true

mkdir ./stream  >/dev/null 2>&1 || true

npm start

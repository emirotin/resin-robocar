#!/bin/bash

modprobe i2c-dev || true
modprobe v4l2_common || true
modprobe bcm2835-v4l2 || true

mkdir ./stream || true

npm start

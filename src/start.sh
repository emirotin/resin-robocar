#!/bin/bash

modprobe i2c-dev || true
#modprobe i2c-bcm2708
modprobe bcm2835-v4l2 || true

npm start

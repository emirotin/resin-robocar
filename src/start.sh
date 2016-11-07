#!/bin/bash

modprobe i2c-dev || true
modprobe bcm2835-v4l2 || true

npm start

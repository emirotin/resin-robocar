#!/bin/bash

modprobe i2c-dev || true
modprobe v4l2_common || true
modprobe bcm2835-v4l2 || true

mount -t tmpfs tmpfs /tmp
mkdir /tmp/stream || true

npm start

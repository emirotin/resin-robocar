#!/bin/bash

modprobe i2c-dev || true
#modprobe i2c-bcm2708
modprobe bcm2835-v4l2 || true
modprobe v4l2_common || true
modprobe spi_bcm2835 || true

v4l2-ctl --overlay=1

npm start

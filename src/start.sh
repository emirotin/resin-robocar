#!/bin/bash

modprobe i2c-dev || true
#modprobe i2c-bcm2708
modprobe v4l2_common || true

npm start

#!/bin/bash

modprobe i2c-dev || true
modprobe i2c-bcm2708 || true

# Start sshd if we don't use the init system
if [ "$INITSYSTEM" != "on" ]; then
  /usr/sbin/sshd -p 22 &
fi

echo "This is where your application would start..."
while : ; do
  echo "waiting"
  sleep 60
done

npm start

#!/bin/sh
ngrok config add-authtoken "$NGROK_AUTHTOKEN"

exec ngrok http http://caddy:80 --log=stdout

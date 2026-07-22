@echo off
cd /d C:\Users\valen\Projects\vigia-judicial
set PATH=C:\Program Files\nodejs;%PATH%
call npm run build > build-log.txt 2>&1
echo EXIT:%ERRORLEVEL%
type build-log.txt | more +0

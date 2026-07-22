@echo off
cd /d C:\Users\valen\Projects\vigia-judicial
set PATH=C:\Program Files\nodejs;C:\Program Files\Git\bin;%PATH%
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "Fix build: tipos Supabase en mutations API"
"C:\Program Files\Git\bin\git.exe" push origin main

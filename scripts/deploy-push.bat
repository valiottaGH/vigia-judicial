@echo off
cd /d C:\Users\valen\Projects\vigia-judicial
"C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo BUILD FAILED
  exit /b 1
)
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "Fix build TypeScript Supabase update"
"C:\Program Files\Git\bin\git.exe" push origin main

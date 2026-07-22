@echo off
cd /d C:\Users\valen\Projects\vigia-judicial
"C:\Program Files\Git\bin\git.exe" commit -m "Initial commit Vigia Judicial"
if errorlevel 1 exit /b 1
"C:\Program Files\Git\bin\git.exe" branch -M main
"C:\Program Files\Git\bin\git.exe" remote remove origin 2>nul
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/valiottaGH/vigia-judicial.git
"C:\Program Files\Git\bin\git.exe" push -u origin main --force

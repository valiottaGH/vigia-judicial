#!/bin/bash
set -e
cd "$(dirname "$0")/.."

echo "=== Recreando repo (solo archivos trackeables por .gitignore) ==="
rm -rf .git
git init
git add .

if git diff --cached --name-only | grep -qE '^\.env\.local$|^\.env$|node_modules/'; then
  echo "ERROR: archivos sensibles en staging. Revisa .gitignore"
  exit 1
fi

if git diff --cached --name-only | grep -qE 'sk-or-v1-|eyJhbGci|APP_USR-[0-9a-f]{8}-'; then
  echo "ERROR: posible secreto en archivos staged. Abortando."
  exit 1
fi

echo "Archivos a commitear: $(git diff --cached --name-only | wc -l)"
git commit -m "Initial commit - Fast Cedu"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/valiottaGH/vigia-judicial.git
git remote -v
git push -u origin main --force

echo "=== Listo ==="

#!/bin/bash
set -e
cd /c/Users/valen/Projects/vigia-judicial

echo "=== Recreando repo sin node_modules ==="
rm -rf .git
git init
git add .

if git diff --cached --name-only | grep -q '^node_modules/'; then
  echo "ERROR: node_modules sigue en el staging. Revisa .gitignore"
  exit 1
fi

echo "Archivos a commitear: $(git diff --cached --name-only | wc -l)"
git commit -m "Initial commit - Vigia Judicial"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/valiottaGH/vigia-judicial.git
git remote -v
git push -u origin main --force

echo "=== Listo ==="

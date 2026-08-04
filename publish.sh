#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Verwendung: ./publish.sh https://github.com/BENUTZER/REPOSITORY.git"
  exit 1
fi

python3 tools/validate_content.py .
python3 tools/update_material_manifest.py .
python3 tools/check_internal_links.py .
git init
git add .
git commit -m "Kursseite aktualisieren" || true
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "$1"
git push -u origin main

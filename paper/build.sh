#!/usr/bin/env bash
# Build paper/paper.pdf from paper/paper.md (run from anywhere).
set -euo pipefail
cd "$(dirname "$0")"
pandoc paper.md -o paper.pdf --pdf-engine=xelatex --resource-path=.:.. \
  -V colorlinks=true -V header-includes='\usepackage{float}\floatplacement{figure}{H}'
echo "wrote $(pwd)/paper.pdf"

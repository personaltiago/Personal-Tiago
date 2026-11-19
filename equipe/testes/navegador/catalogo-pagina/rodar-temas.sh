#!/bin/bash
# uso: ./rodar-temas.sh <claro|dark|light> [pagina]  — matriz de vazamento nos 5 temas (5 janelas), com a página real
modo=$1; pagina=${2:-prof-287.html}
for d in current neon metal pro deep; do
  echo "##### $d/$modo"
  node matriz.js "$pagina" - catalogo,workoutRestDialog,lessonDialog,workoutVideoDialog,colorPanelDialog 390x844 $d $modo 2>&1 | tail -n 8 | cut -c1-200
done

/**
 * Comandante Nébula: un gato blanco de medio cuerpo, al estilo de las novelas gráficas. Dos bocas (cerrada y abierta):
 * la escena le pone `is-open` al contenedor para abrir la boca mientras habla.
 */
export const commanderSvg = (): string => `<svg viewBox="0 0 200 220" width="190" height="209" aria-hidden="true">
  <path d="M26 220 Q26 150 100 146 Q174 150 174 220Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/>
  <path d="M30 192 Q100 180 170 192 V206 Q100 194 30 206Z" fill="#9b7bff" stroke="#0e0b33" stroke-width="4" stroke-linejoin="round"/>
  <ellipse cx="100" cy="150" rx="48" ry="14" fill="#c4c2e0" stroke="#0e0b33" stroke-width="4"/>
  <circle cx="142" cy="176" r="11" fill="#ffcb47" stroke="#0e0b33" stroke-width="3.5"/><path d="M142 169 l2.6 5.4 6 .8 -4.3 4.2 1 6 -5.3 -2.8 -5.3 2.8 1 -6 -4.3 -4.2 6 -.8Z" fill="#0e0b33" transform="scale(.6) translate(94 117)"/>
  <path d="M52 66 L42 12 L92 42Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/>
  <path d="M148 66 L158 12 L108 42Z" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5" stroke-linejoin="round"/>
  <path d="M55 56 L49 27 L77 44Z M145 56 L151 27 L123 44Z" fill="#ffb3c1"/>
  <ellipse cx="100" cy="94" rx="66" ry="56" fill="#f5f5f2" stroke="#0e0b33" stroke-width="5"/>
  <path d="M100 42 V60 M86 45 L90 60 M114 45 L110 60" stroke="#9b7bff" stroke-width="5" stroke-linecap="round"/>
  <path d="M60 80 L88 86 M140 80 L112 86" stroke="#0e0b33" stroke-width="5" stroke-linecap="round"/>
  <circle cx="76" cy="98" r="9" fill="#0e0b33"/><circle cx="124" cy="98" r="9" fill="#0e0b33"/>
  <circle cx="79" cy="94.5" r="3" fill="#fff"/><circle cx="127" cy="94.5" r="3" fill="#fff"/>
  <path d="M94 110 H106 L100 117Z" fill="#ff8fa5" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/>
  <path d="M40 106 L68 110 M40 120 L68 116 M160 106 L132 110 M160 120 L132 116" stroke="#0e0b33" stroke-width="2.5" stroke-linecap="round" opacity=".55"/>
  <g class="cmd__closed"><path d="M86 122 Q93 130 100 122 Q107 130 114 122" fill="none" stroke="#0e0b33" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>
  <g class="cmd__open"><path d="M86 121 Q100 118 114 121 Q112 142 100 142 Q88 142 86 121Z" fill="#0e0b33" stroke="#0e0b33" stroke-width="3" stroke-linejoin="round"/><path d="M92 135 Q100 129 108 135 Q104 141 100 141 Q96 141 92 135Z" fill="#ff6b7a"/></g>
  <path d="M164 100 Q178 118 150 136" fill="none" stroke="#0e0b33" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="136" r="5" fill="#ffcb47" stroke="#0e0b33" stroke-width="3"/>
</svg>`;

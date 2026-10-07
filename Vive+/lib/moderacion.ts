const PALABRAS_OFENSIVAS = [
  "idiota", "imbecil", "imbécil", "estupido", "estúpido", "subnormal",
  "mierda", "puta", "puto", "cabron", "cabrón", "gilipollas", "joder",
  "coño", "cojones", "hostia", "hostias", "capullo", "maricon", "maricón",
  "zorra", "perra", "retrasado",
];

function quitarAcentos(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


const REGEXES = PALABRAS_OFENSIVAS.map((palabra) => {
  const letras = quitarAcentos(palabra).split("");
  return new RegExp("\\b" + letras.join("[\\W_]*") + "\\b", "i");
});

export function contieneLenguajeInapropiado(texto: string): boolean {
  const limpio = quitarAcentos(texto);
  return REGEXES.some((re) => re.test(limpio));
}

// utils/wordProcessor.ts

interface DictionaryType {
  [key: string]: string | string[];
}

interface LemmasType {
  [key: string]: string;
}

/**
 * Limpia una palabra eliminando signos de puntuación y convirtiendo a minúsculas
 */
export const limpiarPalabra = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+|[.,\/#!$%\^&\*;:{}=\-_`~()¿?¡!«»"']+/g, "")
    .trim();
};

/**
 * Convierte el resultado a string, si es un array lo une con comas
 */
const convertirAString = (resultado: string | string[]): string => {
  if (Array.isArray(resultado)) {
    return resultado.join(", ");
  }
  return resultado;
};

/**
 * Intenta encontrar la forma base de una palabra inglesa conjugada o comparativa
 */
const encontrarFormaBase = (
  palabra: string,
  diccionario: DictionaryType
): string | null => {
  let posibleBase = null;

  // === TERMINACIONES VERBALES ===
  const terminacionesVerbales = [
    "ing", "ed", "s", "es", "ies"
  ];

  // === TERMINACIONES DE ADJETIVOS ===
  const terminacionesAdjetivos = [
    { term: "est", tipo: "superlativo" },
    { term: "er", tipo: "comparativo" },
    { term: "ier", tipo: "comparativo" },
    { term: "iest", tipo: "superlativo" }
  ];

  // Probar con terminaciones verbales
  for (let term of terminacionesVerbales) {
    if (palabra.endsWith(term)) {
      let base = palabra.slice(0, -term.length);

      if (term === "ies") {
        base = base.slice(0, -1) + "y";
      } else if (term === "ing") {
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          base = base.slice(0, -1);
        }
        if (base.endsWith("e") && base.length > 2) {
          base = base.slice(0, -1);
        }
      } else if (term === "ed") {
        if (base.endsWith("e")) {
          base = base.slice(0, -1);
        }
        if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
          base = base.slice(0, -1);
        }
        if (base.endsWith("i")) {
          base = base.slice(0, -1) + "y";
        }
      }

      if (base && diccionario[base]) {
        posibleBase = base;
        break;
      }
    }
  }

  // Probar con terminaciones de adjetivos
  if (!posibleBase) {
    for (let adj of terminacionesAdjetivos) {
      if (palabra.endsWith(adj.term)) {
        let base = palabra.slice(0, -adj.term.length);

        if (adj.term === "ier" || adj.term === "iest") {
          base = base.slice(0, -1) + "y";
        } else if (adj.term === "er" || adj.term === "est") {
          if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
            base = base.slice(0, -1);
          }
        }

        if (base && diccionario[base]) {
          posibleBase = base;
          break;
        }
      }
    }
  }

  // Probar quitando "e" final
  if (!posibleBase && palabra.endsWith("e") && palabra.length > 3) {
    const sinE = palabra.slice(0, -1);
    if (diccionario[sinE]) {
      posibleBase = sinE;
    }
  }

  // Probar con la forma base + "e"
  if (!posibleBase && palabra.length > 2) {
    const conE = palabra + "e";
    if (diccionario[conE]) {
      posibleBase = conE;
    }
  }

  return posibleBase;
};

/**
 * Obtiene la traducción de una palabra seleccionada
 * Siempre retorna un string (vacío si no encuentra traducción)
 */
export const obtenerTraduccion = (
  text: string,
  diccionario: DictionaryType,
  lemas: LemmasType
): string => {
  const palabraLimpia = limpiarPalabra(text);

  if (!palabraLimpia) return "";

  let resultado = null;

  // Buscar exactamente la palabra
  if (diccionario[palabraLimpia]) {
    resultado = diccionario[palabraLimpia];
  } else {
    // Buscar por lema
    const formaBase = lemas[palabraLimpia];
    if (formaBase && diccionario[formaBase]) {
      resultado = diccionario[formaBase];
    } else {
      // Buscar forma base mediante reglas
      const posibleBase = encontrarFormaBase(palabraLimpia, diccionario);
      if (posibleBase && diccionario[posibleBase]) {
        resultado = diccionario[posibleBase];
      }
    }
  }

  // Convertir a string siempre
  if (resultado) {
    return convertirAString(resultado);
  }

  return "";
};
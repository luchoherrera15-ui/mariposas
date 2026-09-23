// Generado por scripts/bajar-fotos.mjs. No editar a mano.
// Todas las fotos vienen de Wikimedia Commons y exigen atribución.

export type CreditoFoto = {
  autor: string;
  licencia: string;
  origen: string;
  titulo: string;
};

export const creditos: Record<string, CreditoFoto> = {
  "portada": {
    "autor": "Charles J. Sharp",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Common_morpho_(Morpho_helenor_peleides).jpg",
    "titulo": "Common morpho (Morpho helenor peleides).jpg"
  },
  "morpho-azul": {
    "autor": "Thad Zajdowicz from Altadena, California, USA",
    "licencia": "CC BY 2.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Blue_Morpho_(6133928076).jpg",
    "titulo": "Blue Morpho (6133928076).jpg"
  },
  "buho-gigante": {
    "autor": "Robek",
    "licencia": "FAL",
    "origen": "https://commons.wikimedia.org/wiki/File:Caligo_Memnon_Owl_Butterfly.jpg",
    "titulo": "Caligo Memnon Owl Butterfly.jpg"
  },
  "monarca": {
    "autor": "Charles J. Sharp",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Monarch_butterflies_(Danaus_plexippus_plexippus)_Piedra_Herrada_2.jpg",
    "titulo": "Monarch butterflies (Danaus plexippus plexippus) Piedra Herrada 2.jpg"
  },
  "alas-de-cristal": {
    "autor": "The Modern Polymath",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:2024-07-23_Greta_oto.jpg",
    "titulo": "2024-07-23 Greta oto.jpg"
  },
  "cebra": {
    "autor": "Charles J. Sharp",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Zebra_(Heliconius_charithonia_ramsdeni).JPG",
    "titulo": "Zebra (Heliconius charithonia ramsdeni).JPG"
  },
  "cola-de-golondrina": {
    "autor": "Green lama",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Papilio_thoas_-_the_king_swallowtail.jpg",
    "titulo": "Papilio thoas - the king swallowtail.jpg"
  },
  "malaquita": {
    "autor": "Charles J. Sharp",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Malachite_(Siproeta_stelenes_insularis).jpg",
    "titulo": "Malachite (Siproeta stelenes insularis).jpg"
  },
  "ochenta-y-ocho": {
    "autor": "Charles J. Sharp",
    "licencia": "CC BY-SA 4.0",
    "origen": "https://commons.wikimedia.org/wiki/File:Eluina_eighty-eight_(Diaethria_eluina)_Wayra.jpg",
    "titulo": "Eluina eighty-eight (Diaethria eluina) Wayra.jpg"
  }
};

/** Ruta pública de la foto de una especie, o null si no se descargó. */
export function foto(slug: string) {
  return creditos[slug] ? `/fotos/${slug}.jpg` : null;
}

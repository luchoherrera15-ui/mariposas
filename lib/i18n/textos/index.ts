import type { Idioma } from "../idiomas";
import en from "./en";
import es, { type Textos } from "./es";
import fr from "./fr";
import it from "./it";
import zh from "./zh";

export type { Textos };

export const TEXTOS: Record<Idioma, Textos> = { en, es, it, fr, zh };

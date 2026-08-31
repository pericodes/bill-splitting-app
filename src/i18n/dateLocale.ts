import { es, enUS } from "date-fns/locale";

export function dateFnsLocale(language: string) {
  return language.startsWith("en") ? enUS : es;
}

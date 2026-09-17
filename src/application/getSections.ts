import { SECTIONS, type Section } from "../domain/sections";

export function getSections(): readonly Section[] {
  return SECTIONS;
}

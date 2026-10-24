import { look } from "@/components/globe/globe-antique"
import { pictureOf, type Inks } from "@/components/globe/kit-view"

/**
 * The journey's picture, painted on this device: since run 27 the antique globe Griffin and Nadia chose
 * (components/globe/globe-antique.tsx), by day in Autumn and by night in Lantern. One painting per theme and size,
 * shared by the globe (journey-look.tsx) and the flat map (journey-flat.tsx).
 */
export const paintGlobe = (night: boolean, width = 2048) => pictureOf(look, night, width, [], {} as Inks)

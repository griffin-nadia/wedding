/** The kid opener's prints to choose from (run 24, section 7), shared by the entry's knobs and the take */
export type Pick = {
  id: string; label: string; alt: string
  /** On the site already (photos.json) */
  photo?: string
  /** photos-private, dev server only: the file, its width ÷ height, the centre to crop on (0 to 1), zoom, turn */
  file?: string; a?: number; at?: [number, number]; z?: number; rot?: number
}
export const GRIFFIN: Pick[] = [
  { id: "portrait", label: "School portrait, 1998 (griffin-kid-portrait-1998)", alt: "Griffin as a little boy, his school portrait in a red T-shirt", file: "griffin-kid-portrait-1998-800.webp", a: 800 / 1143, at: [0.52, 0.38], z: 1.35 },
  { id: "first-day", label: "First day of school (kid-griffin, on the site)", alt: "", photo: "kid-griffin" },
  { id: "zoo", label: "At the zoo (griffin-kid-zoo)", alt: "Griffin as a toddler holding the bars of a gate at Calgary Zoo", file: "griffin-kid-zoo-800.webp", a: 800 / 529, at: [0.41, 0.5], z: 1.9 },
  { id: "snow", label: "In the snow (griffin-kid-snow)", alt: "Griffin as a toddler in a red beanie, playing in deep snow", file: "griffin-kid-snow-800.webp", a: 800 / 530, at: [0.5, 0.5], z: 1.9 },
  { id: "lizards", label: "Lizards T-shirt (griffin-kid-lizards)", alt: "Griffin as a boy in a cap, pulling a face and making a peace sign", file: "griffin-kid-lizards-800.webp", a: 800 / 532, at: [0.47, 0.5], z: 1.9 },
  { id: "pokemon", label: "Pokémon jumper (griffin-kid-pokemon)", alt: "Griffin as a boy laughing in a Pokémon jumper, arms out wide", file: "griffin-kid-pokemon-800.webp", a: 800 / 536, at: [0.47, 0.5], z: 1.9 },
]
// photos-private/kids, by eye (22 Oct): left out are Nadia Car.jpg, nadia-carseat-crop.jpg and nadia-young-3.jpg (the
// date burned in; no-date versions exist), nadia-young-2.jpg (the home photo again, a rougher scan), the two _NBG
// PNGs (the same photos on a transparent page) and nadia-carseat-nodate-crop.png (what kid-nadia is made from)
export const NADIA: Pick[] = [
  { id: "home", label: "Home (kids/Nadia Home.jpg)", alt: "Nadia as a little girl with bunches in her hair, grinning, in a green Christmas T-shirt", file: "kids/Nadia Home.jpg", a: 1, at: [0.53, 0.43], z: 2 },
  { id: "car", label: "Car seat (kid-nadia, on the site)", alt: "", photo: "kid-nadia" },
  { id: "car-nodate", label: "Car, no date, the whole print (kids/Nadia Car_No date.jpg)", alt: "Nadia as a little girl in the back seat of a car, in a cap, smiling", file: "kids/Nadia Car_No date.jpg", a: 1, at: [0.49, 0.5], z: 1.9 },
  { id: "ride-on", label: "Ride-on toy (kids/nadia-young-1.jpg)", alt: "Nadia as a toddler on a red and yellow ride-on toy indoors", file: "kids/nadia-young-1.jpg", a: 2448 / 3486, at: [0.5, 0.5], z: 2.7 },
  { id: "chair", label: "Wicker chair (kids/nadia-young-4.jpg)", alt: "Nadia as a little girl in a white wicker chair on a verandah", file: "kids/nadia-young-4.jpg", a: 2448 / 3486, at: [0.55, 0.43], z: 3.3, rot: 90 },
  { id: "table", label: "At the table (kids/nadia-young-5.jpg)", alt: "Nadia as a little girl at a table with a flowered cloth, in a kitchen", file: "kids/nadia-young-5.jpg", a: 2448 / 3486, at: [0.52, 0.45], z: 2.6 },
  { id: "garden", label: "Garden (kids/nadia-young-6.jpg)", alt: "Nadia as a little girl outside on the grass in front of a flower garden", file: "kids/nadia-young-6.jpg", a: 2448 / 3486, at: [0.57, 0.5], z: 3.1, rot: -90 },
]
export const ALL = [...GRIFFIN.map((p) => ({ ...p, key: `g-${p.id}` })), ...NADIA.map((p) => ({ ...p, key: `n-${p.id}` }))]
export const BEHIND: [string, string][] = [["none", "None"], ...ALL.map((p): [string, string] => [p.key, `${p.key[0] === "g" ? "Griffin" : "Nadia"}: ${p.label}`])]


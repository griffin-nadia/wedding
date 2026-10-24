import { useKnob } from "../../params"
import { GlobeLab } from "./kit"
import { LOOKS } from "./globe-nadia"

/** Nadia's look in the lab, with its Painting knob (the stand-in, the blank template, or hers) */
export default function GlobeNadia() {
  const which = useKnob("painting", "standin")
  return <GlobeLab look={LOOKS[which] ?? LOOKS.standin} />
}

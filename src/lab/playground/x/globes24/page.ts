import { createElement, lazy } from "react"
import type { Look } from "./kit-view"

/** A look's lab page (run 27): the look file only exports its `look` (so the looks picker can load it without the lab),
 *  and this puts it in the kit's GlobeLab */
export const lookPage = (load: () => Promise<{ look: Look }>) => lazy(async () => {
  const [{ GlobeLab }, { look }] = await Promise.all([import("./kit"), load()])
  return { default: () => createElement(GlobeLab, { look }) }
})

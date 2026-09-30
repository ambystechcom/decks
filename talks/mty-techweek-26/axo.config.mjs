import { defineConfig } from '@ambystech/axo';

// defineConfig gives you autocomplete and type-checking in your editor.
// (Plain `export default {...}` works too — the types are just a nicety.)
export default defineConfig({
  title: "Tu siguiente usuario es un agente",
  lang: "es",

  /**
   * NOT a label — a guard.
   *
   *   public        `axo build` works; a deploy workflow is scaffolded
   *   internal      builds, warns; nothing auto-deploys
   *   confidential  `axo build` REFUSES. Deliver the PDF (`axo pdf`).
   *
   * Changing this changes what the tooling will let you do. A public URL cannot be
   * un-indexed, so a confidential deck belongs in a PRIVATE repo, delivered as a PDF.
   */
  visibility: "public",

  footer: {
    notice: "",
    entity: "Xolotl Byteworks S.A de C.V",
    site: 'www.ambystech.com',
    logo: 'assets/img/isotipo.png',
  },

  // Reveal.js options, merged over Axo's defaults.
  reveal: {},
});

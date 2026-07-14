/**
 * Gaia (the guide) avatar + her question.
 *
 * The Figma design uses a photo of Gaia. To use it, export that asset to
 * `public/images/gaia.png` and swap the placeholder <span> below for:
 *
 *   <Image src="/images/gaia.png" alt="Gaia" fill sizes="60px" className="object-cover" />
 *
 * (import Image from "next/image"). Until the asset is committed we render a
 * branded monogram so the layout is complete and nothing 404s.
 */
export function GaiaBubble({ question }: { question: string }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex size-[60px] items-center justify-center overflow-hidden rounded-full border border-[rgba(125,135,96,0.25)] bg-gradient-to-br from-[#e9f4cf] to-[#c8ff3e] text-[24px] font-bold text-[#2d3d00] shadow-[0px_4px_14px_rgba(129,74,0,0.08)]">
        G
      </span>

      {/* Question — preserves intentional line breaks from the step config. */}
      <h3 className="max-w-[560px] whitespace-pre-line text-[20px] font-bold leading-[1.4] text-[#2d3d00]">
        {question}
      </h3>
    </div>
  );
}

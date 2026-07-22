import Image from "next/image";

/**
 * Camo (the guide) avatar + his question — centered, stacked (avatar above
 * text), matching every multi-field screen in Figma (CreateAccountScreen,
 * VehicleScreen, SignupScreen, …). This is a plain in-flow layout — unlike
 * EntryScreen's header avatar, this one doesn't need to straddle a header,
 * it just sits centered at the top of the screen's content.
 */
export function GaiaBubble({ question }: { question: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <Image
        src="/images/camo-avatar.png"
        alt="Camo, your customer support chameleon"
        width={80}
        height={80}
        className="size-20 rounded-full object-cover"
      />

      {/* Question — preserves intentional line breaks from the step config. */}
      <h3 className="max-w-[763px] whitespace-pre-line text-[20px] font-bold leading-[1.4] text-[#2d3d00]">
        {question}
      </h3>
    </div>
  );
}

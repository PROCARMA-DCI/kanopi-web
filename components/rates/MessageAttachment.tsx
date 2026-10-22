"use client";

import { cn } from "@/lib/utils";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i;

/** Is this URL (ignoring ?query/#hash) an image, going by its extension? */
export function isImageUrl(url: string) {
  return IMAGE_EXT.test(url.split(/[?#]/)[0]);
}

/**
 * An attachment on a chat message: images show as a thumbnail with a
 * "View image" link (opens the full size in a new tab); any other file
 * shows as a "View file" link.
 */
export function MessageAttachment({
  url,
  mine,
}: {
  url: string;
  mine?: boolean;
}) {
  const linkClass = cn(
    "mt-1 inline-block text-[12px] font-semibold underline underline-offset-2",
    mine ? "text-[#2d3d00]" : "text-[#5c6b3a]",
  );

  if (!isImageUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        📎 View file
      </a>
    );
  }

  return (
    <div className="mb-1">
      <a href={url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Attachment"
          className="max-h-60 w-full rounded-xl object-cover"
        />
      </a>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        View image
      </a>
    </div>
  );
}

"use client";

import Image, { type ImageProps } from "next/image";

// Gallery screenshots come pre-sized as <name>-480.webp and <name>-960.webp beside the original
// (scripts/gallery-images.mjs), so the server converts nothing when a visitor asks for one (client, 18 Nov 2026).
const loader = ({ src, width }: { src: string; width: number }) => src.replace(/\.\w+$/, width <= 480 ? "-480.webp" : "-960.webp");

export function GalleryImage(props: ImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt comes in with the props
  return <Image loader={loader} {...props} />;
}

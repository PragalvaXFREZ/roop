/*
 * Product photo with a fixed 4:5 frame.
 * If the product has no photo, the frame shows a plain block of the line colour.
 */

/*
 * Photos come from /api/uploads through the API rewrite.
 * Thus, use a plain img and not the Next.js image optimizer.
 */
export function ProductImage({ src, alt, className = "" }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`aspect-[4/5] w-full overflow-hidden bg-line ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt={alt} className="h-full w-full object-cover" />}
    </div>
  );
}

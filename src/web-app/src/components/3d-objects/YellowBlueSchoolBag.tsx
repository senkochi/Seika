import { Images } from "@/assets/images";

type YellowBlueSchoolBagProps = {
  /** Render width in pixels. Height auto-scales to preserve the 1:1 aspect ratio. */
  width?: number;
};

/**
 * School bag — intrinsic 3000x3000 PNG.
 *
 * Tailwind v4 preflight sets `img { max-width: 100%; height: auto }` which
 * silently clamps our inline `width` whenever the parent column is narrower
 * than the requested size. To honour `width` we explicitly nullify max-width.
 */
function YellowBlueSchoolBag({ width = 360 }: YellowBlueSchoolBagProps) {
  return (
    <img
      src={Images.YellowBlueSchoolBag}
      alt="Yellow Blue School Bag"
      width={width}
      style={{
        width: `${width}px`,
        height: "auto",
        maxWidth: "none",
        display: "block",
      }}
    />
  );
}

export default YellowBlueSchoolBag;
import { Images } from "@/assets/images";

type GameJoystickProps = {
  /** Render width in pixels. Height auto-scales to preserve the 544:483 aspect ratio. */
  width?: number;
};

/**
 * Game joystick — intrinsic 544x483 PNG.
 *
 * Tailwind v4 preflight sets `img { max-width: 100%; height: auto }` which
 * silently clamps our inline `width` whenever the parent column is narrower
 * than the requested size. To honour `width` we explicitly nullify max-width.
 */
function GameJoystick({ width = 280 }: GameJoystickProps) {
  return (
    <img
      src={Images.GameJoystick}
      alt="Game Joystick"
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

export default GameJoystick;
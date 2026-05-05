import { Images } from "@/assets/images";

type GameJoystickProps = {
  size?: number;
};

function GameJoystick({ size = 544 }: GameJoystickProps) {
  return (
    <img src={Images.GameJoystick} alt="Game Joystick" width={size} height={size} />
  );
}

export default GameJoystick;

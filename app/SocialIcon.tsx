import type { IconType } from "react-icons";
import { FaLinkedinIn } from "react-icons/fa6";
import { LuGlobe, LuMail } from "react-icons/lu";
import {
  SiBilibili,
  SiGithub,
  SiInstagram,
  SiSinaweibo,
  SiX,
  SiYoutube,
} from "react-icons/si";

import type { SocialPlatform } from "./content-config";

const PLATFORM_ICONS = {
  github: SiGithub,
  linkedin: FaLinkedinIn,
  instagram: SiInstagram,
  x: SiX,
  youtube: SiYoutube,
  bilibili: SiBilibili,
  weibo: SiSinaweibo,
  website: LuGlobe,
  email: LuMail,
} satisfies Record<SocialPlatform, IconType>;

interface SocialIconProps {
  platform: SocialPlatform;
  className?: string;
}

export function SocialIcon({
  platform,
  className,
}: SocialIconProps) {
  const Icon = PLATFORM_ICONS[platform];

  return (
    <Icon
      aria-hidden="true"
      className={className}
      focusable="false"
    />
  );
}

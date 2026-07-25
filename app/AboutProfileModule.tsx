"use client";

import { useState } from "react";
import type {
  ContentLocale,
  ProfileContent,
  SocialLink,
} from "./content-config";
import { SocialIcon } from "./SocialIcon";

const SOCIAL_LABELS = {
  zh: {
    github: "GitHub",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    x: "X",
    youtube: "YouTube",
    bilibili: "哔哩哔哩",
    weibo: "微博",
    website: "个人网站",
    email: "邮箱",
  },
  en: {
    github: "GitHub",
    linkedin: "LinkedIn",
    instagram: "Instagram",
    x: "X",
    youtube: "YouTube",
    bilibili: "Bilibili",
    weibo: "Weibo",
    website: "Website",
    email: "Email",
  },
} as const;

interface AboutProfileModuleProps {
  locale: ContentLocale;
  profile: ProfileContent;
  intro: string;
  photoSrc?: string;
  photoAlt?: string;
  socialLinks: readonly SocialLink[];
}

export function AboutProfileModule({
  locale,
  profile,
  intro,
  photoSrc,
  photoAlt,
  socialLinks,
}: AboutProfileModuleProps) {
  const [failedPhotoSrc, setFailedPhotoSrc] = useState<string>();

  const portraitAlt =
    photoAlt?.trim() ||
    (locale === "zh"
      ? `${profile.displayName}的个人照片`
      : `Portrait of ${profile.displayName}`);

  return (
    <section
      className="about-profile-card"
      aria-label={locale === "zh" ? "个人名片" : "Profile card"}
    >
      <figure className="about-portrait-column">
        <div className="about-portrait">
          {photoSrc && photoSrc !== failedPhotoSrc ? (
            // Uploaded images are repository-owned static assets with runtime paths.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={portraitAlt}
              loading="lazy"
              decoding="async"
              onError={() => setFailedPhotoSrc(photoSrc)}
            />
          ) : (
            <div className="about-portrait-placeholder" role="img" aria-label={portraitAlt}>
              <span>{profile.logoInitial}</span>
              <small>
                {locale === "zh" ? "个人照片" : "PORTRAIT"}
              </small>
            </div>
          )}
          <i aria-hidden="true">09</i>
        </div>
        <figcaption>
          <strong>{profile.displayName}</strong>
          <span>
            {profile.city} · {profile.timezone}
          </span>
        </figcaption>
      </figure>

      <div className="about-profile-copy">
        <p className="eyebrow">PROFILE / 09</p>
        <p className="about-bio">{intro}</p>
        {socialLinks.length > 0 && (
          <nav
            className="about-social-links"
            aria-label={
              locale === "zh" ? "社交媒体与联系方式" : "Social media and contact links"
            }
          >
            {socialLinks.map((link) => {
              const label =
                link.label?.[locale]?.trim() ||
                SOCIAL_LABELS[locale][link.platform];
              const external = /^https?:\/\//i.test(link.url);

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                >
                  <SocialIcon platform={link.platform} />
                  <span>{label}</span>
                  <i aria-hidden="true">↗</i>
                </a>
              );
            })}
          </nav>
        )}
      </div>
    </section>
  );
}

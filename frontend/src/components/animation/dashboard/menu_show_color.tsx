import React, { useEffect } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";

interface MenuShowColorProps {
  items: { title: string; url: string; icon: React.ElementType }[];
  activeColor?: string;
}

const MenuShowColor: React.FC<MenuShowColorProps> = ({ items, activeColor = "#1e40af" }) => {
  const pathname = usePathname();

  useEffect(() => {
    items.forEach((item) => {
      const element = document.querySelector(`[href="${item.url}"]`) as HTMLAnchorElement;
      if (element) {
        if (pathname === item.url) {
          gsap.to(element, {
            color: activeColor,
            duration: 0.3,
            ease: "power1.inOut",
          });
        } else {
          gsap.to(element, {
            color: "",
            duration: 0.3,
            ease: "power1.inOut",
          });
        }
      }
    });
  }, [pathname, items, activeColor]);

  return null;
};

export default MenuShowColor;
/**
 * @file This file provides a component that animates the color of menu items
 * based on the current path.
 *
 * It uses GSAP to animate the color of the active menu item.
 */

import React, { useEffect } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";

/**
 * The props for the `MenuShowColor` component.
 *
 * @interface MenuShowColorProps
 * @property {Array<{ title: string; url: string; icon: React.ElementType }>} items - The menu items.
 * @property {string} [activeColor] - The color of the active menu item.
 */
interface MenuShowColorProps {
  items: { title: string; url: string; icon: React.ElementType }[];
  activeColor?: string;
}

/**
 * A component that animates the color of menu items based on the current path.
 *
 * @param {MenuShowColorProps} props - The props for the component.
 * @returns {null} This component does not render anything.
 */
const MenuShowColor: React.FC<MenuShowColorProps> = ({
  items,
  activeColor = "#1e40af",
}) => {
  const pathname = usePathname();

  useEffect(() => {
    items.forEach((item) => {
      const element = document.querySelector(
        `[href="${item.url}"]`
      ) as HTMLAnchorElement;
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
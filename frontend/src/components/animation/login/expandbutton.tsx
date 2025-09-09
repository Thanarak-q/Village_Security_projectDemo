/**
 * @file This file provides a button component that expands on click.
 *
 * It uses GSAP to animate the button's scale and border radius.
 * After the animation is complete, it navigates to the dashboard.
 */

import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

/**
 * The props for the `ExpandButton` component.
 *
 * @interface ExpandButtonProps
 * @property {() => void} [onClick] - The function to call when the button is clicked.
 * @property {React.ReactNode} children - The content of the button.
 */
interface ExpandButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
}

/**
 * A button component that expands on click.
 *
 * @param {ExpandButtonProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered button component.
 */
const ExpandButton: React.FC<ExpandButtonProps> = ({ onClick, children }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    if (buttonRef.current && !isExpanding) {
      setIsExpanding(true);
      gsap.to(buttonRef.current, {
        scale: 30,
        borderRadius: 0,
        duration: 1.2,
        ease: "power3.inOut",
        onComplete: () => {
          router.push("/dashboard");
        },
      });
    }
    if (onClick) onClick();
  };

  const handleHover = (isHovering: boolean) => {
    if (buttonRef.current && !isExpanding) {
      gsap.to(buttonRef.current, {
        scale: isHovering ? 1.1 : 1,
        duration: 0.3,
        ease: "power1.inOut",
      });
    }
  };

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={() => handleHover(true)}
      onMouseLeave={() => handleHover(false)}
      className="bg-black text-white px-6 py-3 rounded-lg text-lg shadow-lg"
    >
      {isExpanding ? "Logging In" : children}
    </button>
  );
};

export default ExpandButton;
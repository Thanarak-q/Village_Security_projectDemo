import React, { useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

interface ExpandButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
}

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
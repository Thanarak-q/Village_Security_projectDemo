"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger,SplitText, ScrambleTextPlugin } from "gsap/all";

gsap.registerPlugin(ScrollTrigger,SplitText,ScrambleTextPlugin);

const ScrambleTextExample = () => {
  useEffect(() => {
    gsap.to("#secound", {
      duration: 1,
      scrambleText: {
        text: "Please Login",
        chars: "XO",
        revealDelay: 0.5,
        speed: 0.5,
        newClass: "myClass",
      },
    });
  }, []);

  

  return (
    <div className="text-center font-bold mt-8">
      <p id="first" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Welcome to Village</p>
      <p id="secound" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Please Login</p>
    </div>
  );
};

export default ScrambleTextExample;

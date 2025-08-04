"use client";

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger,SplitText, ScrambleTextPlugin } from "gsap/all";

gsap.registerPlugin(ScrambleTextPlugin);

const ScrambleTextExample = () => {
  useEffect(() => {
    gsap.to("#secound", {
      duration: 1,
      scrambleText: {
        text: "Please log in",
        chars: "XO",
        revealDelay: 0.5,
        speed: 0.5,
        newClass: "myClass",
      },
    });
  }, []);

  

  return (
    <div className="text-center text-bold text-2xl mt-8">
      <p id="first">Welcome to Village</p>
      <p id="secound">Please Log In</p>
    </div>
  );
};

export default ScrambleTextExample;

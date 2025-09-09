"use client";

/**
 * @file This file provides a component that displays a scramble text animation.
 *
 * It uses the GSAP ScrambleTextPlugin to animate the text.
 */

import React, { useEffect } from "react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/all";

gsap.registerPlugin(ScrambleTextPlugin);

/**
 * A component that displays a scramble text animation.
 *
 * @returns {React.ReactElement} The rendered component.
 */
const ScrambleTextExample = (): React.ReactElement => {
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
      <p id="first" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
        Welcome to Village
      </p>
      <p id="secound" className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
        Please Login
      </p>
    </div>
  );
};

export default ScrambleTextExample;

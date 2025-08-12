"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import HouseManagementTable from "./table_house";

export default function page() {
  const tableRef = useRef<HTMLDivElement>(null);

  // GSAP smooth scroll-up animation
  useEffect(() => {
    // Set initial state
    gsap.set(tableRef.current, {
      opacity: 0,
      y: 50
    });

    // Animate entrance
    gsap.to(tableRef.current, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      ease: "power2.inOut",
      delay: 0.2
    });

    return () => {
      gsap.killTweensOf(tableRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header - Content moved to navbar */}
        <div ref={tableRef}>
          <HouseManagementTable />
        </div>
      </div>
    </div>
  );
}

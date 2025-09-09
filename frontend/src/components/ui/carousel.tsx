/**
 * @file This file provides a highly customizable and accessible carousel component.
 *
 * Built on top of `embla-carousel-react`, it offers a robust foundation for creating
 * carousels with features like horizontal/vertical orientation, custom plugins,
 * and navigation controls. The components are designed to be composed together
 * for maximum flexibility.
 */

"use client";

import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

/**
 * A custom hook to access the carousel's context.
 *
 * @throws {Error} If used outside of a `Carousel` component.
 * @returns {CarouselContextProps} The context of the carousel.
 */
function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}

/**
 * The main container for the carousel, providing context to all its children.
 *
 * @param {React.ComponentProps<"div"> & CarouselProps} props - The props for the component.
 * @returns {React.ReactElement} The carousel container.
 */
function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps): React.ReactElement {
  const [carouselRef, api] = useEmblaCarousel({ ...opts, axis: orientation === "horizontal" ? "x" : "y" }, plugins);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext]
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider value={{ carouselRef, api, opts, orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"), scrollPrev, scrollNext, canScrollPrev, canScrollNext }}>
      <div onKeyDownCapture={handleKeyDown} className={cn("relative", className)} role="region" aria-roledescription="carousel" data-slot="carousel" {...props}>
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

/**
 * The content container for the carousel, which holds the carousel items.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The carousel content container.
 */
function CarouselContent({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div ref={carouselRef} className="overflow-hidden" data-slot="carousel-content">
      <div className={cn("flex", orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col", className)} {...props} />
    </div>
  );
}

/**
 * A single item within the carousel.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} A carousel item.
 */
function CarouselItem({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  const { orientation } = useCarousel();
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)}
      {...props}
    />
  );
}

/**
 * A button to scroll to the previous item in the carousel.
 *
 * @param {React.ComponentProps<typeof Button>} props - The props for the component.
 * @returns {React.ReactElement} The previous button.
 */
function CarouselPrevious({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>): React.ReactElement {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn("absolute size-8 rounded-full", orientation === "horizontal" ? "top-1/2 -left-12 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2 rotate-90", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

/**
 * A button to scroll to the next item in the carousel.
 *
 * @param {React.ComponentProps<typeof Button>} props - The props for the component.
 * @returns {React.ReactElement} The next button.
 */
function CarouselNext({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>): React.ReactElement {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn("absolute size-8 rounded-full", orientation === "horizontal" ? "top-1/2 -right-12 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export { type CarouselApi, Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext };

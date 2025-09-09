/**
 * @file This file provides a set of components for creating One-Time Password (OTP) inputs.
 *
 * Built on top of the `input-otp` library, these components offer a flexible way to
 * create OTP fields with customizable slots and separators, ensuring a seamless
 * user experience for entering verification codes.
 */

"use client";

import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The main container for the OTP input field.
 *
 * @param {React.ComponentProps<typeof OTPInput> & { containerClassName?: string }} props - The props for the component.
 * @returns {React.ReactElement} The OTP input container.
 */
function InputOTP({ className, containerClassName, ...props }: React.ComponentProps<typeof OTPInput> & { containerClassName?: string }): React.ReactElement {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

/**
 * A group container for OTP input slots.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} A grouping element for OTP slots.
 */
function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return <div data-slot="input-otp-group" className={cn("flex items-center", className)} {...props} />;
}

/**
 * A single slot for an OTP input, representing one character of the code.
 *
 * @param {React.ComponentProps<"div"> & { index: number }} props - The props for the component, including the slot's index.
 * @returns {React.ReactElement} A single OTP input slot.
 */
function InputOTPSlot({ index, className, ...props }: React.ComponentProps<"div"> & { index: number }): React.ReactElement {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn("data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]", className)}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}

/**
 * A separator component to be placed between OTP input slots.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The separator element.
 */
function InputOTPSeparator({ ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };

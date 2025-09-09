/**
 * @file This file provides a set of components for building accessible and reusable forms.
 *
 * It integrates `react-hook-form` with custom-styled components to create a robust
 * form-building experience. The components include `Form`, `FormField`, `FormItem`,
 * `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`.
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { Controller, FormProvider, useFormContext, useFormState, type ControllerProps, type FieldPath, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

/**
 * A component that connects a form field to the form context.
 *
 * @param {ControllerProps<TFieldValues, TName>} props - The props for the controller.
 * @returns {React.ReactElement} The controller component wrapped in a context provider.
 */
const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({ ...props }: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

/**
 * A custom hook to access form field state and context.
 *
 * @throws {Error} If used outside of a `FormField` component.
 * @returns {Object} An object containing the form field's state and IDs.
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

/**
 * A container for a single form field, including its label, input, description, and error message.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The form item container.
 */
function FormItem({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("grid gap-2", className)} {...props} />
    </FormItemContext.Provider>
  );
}

/**
 * The label for a form field.
 *
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The form label component.
 */
function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>): React.ReactElement {
  const { error, formItemId } = useFormField();
  return <Label data-slot="form-label" data-error={!!error} className={cn("data-[error=true]:text-destructive", className)} htmlFor={formItemId} {...props} />;
}

/**
 * A component that wraps the form input control, connecting it with accessibility attributes.
 *
 * @param {React.ComponentProps<typeof Slot>} props - The props for the component.
 * @returns {React.ReactElement} The form control wrapper.
 */
function FormControl({ ...props }: React.ComponentProps<typeof Slot>): React.ReactElement {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
}

/**
 * A component to provide additional information or help text for a form field.
 *
 * @param {React.ComponentProps<"p">} props - The props for the component.
 * @returns {React.ReactElement} The form description component.
 */
function FormDescription({ className, ...props }: React.ComponentProps<"p">): React.ReactElement {
  const { formDescriptionId } = useFormField();
  return <p data-slot="form-description" id={formDescriptionId} className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

/**
 * A component to display validation error messages for a form field.
 *
 * @param {React.ComponentProps<"p">} props - The props for the component.
 * @returns {React.ReactElement | null} The form message component, or null if there is no error.
 */
function FormMessage({ className, ...props }: React.ComponentProps<"p">): React.ReactElement | null {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p data-slot="form-message" id={formMessageId} className={cn("text-destructive text-sm", className)} {...props}>
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};

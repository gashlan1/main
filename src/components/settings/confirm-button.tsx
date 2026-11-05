"use client";

/** Submit button that asks before firing its form (used for deletes). */
export function ConfirmButton({
  message,
  className,
  formAction,
  children,
}: {
  message: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      formAction={formAction}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

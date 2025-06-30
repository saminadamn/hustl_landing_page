import { StarBorder } from "./star-border";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface StarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function StarButton({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  ...props
}: StarButtonProps) {
  const variantStyles = {
    primary: "bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white",
    secondary: "bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B] text-white",
  };

  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-3 px-6 text-base",
    lg: "py-4 px-8 text-lg",
  };

  const color = variant === 'primary' ? '#0038FF' : '#FF5A1F';
  const speed = variant === 'primary' ? '6s' : '5s';

  return (
    <StarBorder
      color={color}
      speed={speed}
      className={cn("font-semibold shadow-md hover:opacity-90 transition-all duration-300", className)}
    >
      <button
        className={cn(
          "flex items-center justify-center w-full rounded-[16px]",
          variantStyles[variant],
          sizeStyles[size]
        )}
        {...props}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    </StarBorder>
  );
}
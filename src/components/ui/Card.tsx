import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  hover?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export const Card = ({
  className,
  children,
  as: Component = 'div',
  hover = false,
  onClick,
  ...props
}: CardProps & React.HTMLAttributes<HTMLElement>) => {
  return (
    <Component
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
        hover && 'transition-shadow hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

export const CardHeader = ({
  className,
  children,
  ...props
}: CardHeaderProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-6 py-4 border-b border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardContent = ({
  className,
  children,
  ...props
}: CardContentProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({
  className,
  children,
  ...props
}: CardFooterProps & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('px-6 py-4 border-t border-gray-200', className)}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;
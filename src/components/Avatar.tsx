import React from 'react';
import { clsx } from 'clsx';

interface AvatarProps {
  name: string | null;
  src: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'sm', className }) => {
  if (!name) return null;

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <div className={clsx(
      "relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
      !src && "bg-indigo-100 text-indigo-700 font-bold",
      sizeClasses[size],
      className
    )}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

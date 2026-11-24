'use client';

import * as Icons from 'lucide-react';
import React from 'react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function DynamicIcon({ name, className = 'w-5 h-5', size }: DynamicIconProps) {
  // Convert kebab-case or lowercase to PascalCase: 'arrow-down' -> 'ArrowDown', 'utensils' -> 'Utensils'
  const pascalName = name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');

  const IconComponent = (Icons as any)[pascalName] || (Icons as any)[name] || Icons.Tag;

  return <IconComponent className={className} size={size} />;
}

'use client';

import { cn } from '@/lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

const blurMap = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
};

export function GlassCard({
  children,
  className,
  blur = 'lg',
  opacity = 10,
  hover = true,
  glow = false,
  glowColor = 'blue',
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border border-white/10',
        blurMap[blur],
        `bg-white/${opacity}`,
        hover && 'transition-all duration-300 hover:bg-white/20 hover:border-white/20',
        glow && `shadow-lg shadow-${glowColor}-500/20`,
        className
      )}
      style={{
        background: `rgba(255, 255, 255, ${opacity / 100})`,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 글래스 버튼
interface GlassButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function GlassButton({
  children,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: GlassButtonProps) {
  const variants = {
    default: 'bg-white/10 hover:bg-white/20 border-white/20',
    primary: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-400/30 text-blue-300',
    secondary: 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 text-purple-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <motion.button
      className={cn(
        'rounded-full backdrop-blur-md border font-medium',
        'transition-all duration-300',
        'hover:scale-105 active:scale-95',
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// 글래스 배지
interface GlassBadgeProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassBadge({ children, className }: GlassBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
        'bg-white/10 backdrop-blur-md border border-white/20',
        className
      )}
    >
      {children}
    </span>
  );
}

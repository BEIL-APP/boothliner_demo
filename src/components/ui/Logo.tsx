import { Layout } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

export function Logo({ 
  className = '', 
  iconOnly = false, 
  size = 'md',
  variant = 'default' 
}: LogoProps) {
  const sizes = {
    sm: { icon: 'w-4 h-4', box: 'w-6 h-6', text: 'text-sm' },
    md: { icon: 'w-5 h-5', box: 'w-8 h-8', text: 'text-lg' },
    lg: { icon: 'w-7 h-7', box: 'w-12 h-12', text: 'text-2xl' },
  };

  const currentSize = sizes[size];
  
  const iconBgColor = variant === 'white' ? 'bg-white' : 'bg-brand-600';
  const iconColor = variant === 'white' ? 'text-brand-600' : 'text-white';
  const textColor = variant === 'white' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Logo Icon: Abstract Booth Shape */}
      <div className={`${currentSize.box} ${iconBgColor} rounded-lg flex items-center justify-center shadow-sm transform rotate-3 transition-transform hover:rotate-0`}>
        <Layout className={`${currentSize.icon} ${iconColor}`} />
      </div>
      
      {!iconOnly && (
        <span className={`${currentSize.text} font-bold ${textColor} tracking-tight`}>
          Booth<span className={variant === 'white' ? 'text-white/90' : 'text-brand-600'}>Liner</span>
        </span>
      )}
    </div>
  );
}

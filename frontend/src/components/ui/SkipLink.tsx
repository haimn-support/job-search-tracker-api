import React from 'react';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="skip-link focus:top-6"
      onFocus={(e) => {
        // Ensure the skip link is visible when focused
        e.currentTarget.style.top = '6px';
      }}
      onBlur={(e) => {
        // Hide the skip link when not focused
        e.currentTarget.style.top = '-40px';
      }}
    >
      {children}
    </a>
  );
};

export default SkipLink;

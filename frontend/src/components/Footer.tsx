import React from 'react';

export default function Footer() {
  return (
    <footer className="relative z-20 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Bus Tracking System. All rights reserved.</p>
      </div>
    </footer>
  );
}

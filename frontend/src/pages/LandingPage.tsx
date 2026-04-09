import React from 'react';
import { Hero } from '../components/Hero';
import { BentoGrid } from '../components/BentoGrid';
import { CTASection } from '../components/CTASection';
import { Footer } from '../components/Footer';
import { FlightTicker } from '../components/FlightTicker';

export const LandingPage = () => {
  return (
    <main className="relative">
      <Hero />
      {/* Live flight ticker — sits between Hero and Bento grid */}
      <FlightTicker />
      <BentoGrid />
      <CTASection />
      <Footer />
    </main>
  );
};

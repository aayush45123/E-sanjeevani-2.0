// Home.jsx — Composed landing page
import React from "react";
import Hero from "../../components/Hero/Hero";
import FeaturesGrid from "../../components/FeaturesGrid/FeaturesGrid";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import WhyChoose from "../../components/WhyChoose/WhyChoose";
import CtaBanner from "../../components/CtaBanner/CtaBanner";

const Home = () => {
  return (
    <main>
      <Hero />
      <FeaturesGrid />
      <HowItWorks />
      <WhyChoose />
      <CtaBanner />
    </main>
  );
};

export default Home;

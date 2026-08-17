import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import LogoMarquee from "../../components/landing/LogoMarquee";
import Features from "../../components/landing/Features";
import HowItWorks from "../../components/landing/HowItWorks";
import Products from "../../components/landing/Products";
import Testimonials from "../../components/landing/Testimonials";
import FAQ from "../../components/landing/FAQ";
import CTA from "../../components/landing/CTA";
import Footer from "../../components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <LogoMarquee />
        <Features />
        <HowItWorks />
        <Products />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

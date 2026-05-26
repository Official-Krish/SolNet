import GlobalBackground from "@/components/LandingPage/GlobalBackground";
import HeroSection from "@/components/LandingPage/HeroSection";
import LiveMetrics from "@/components/LandingPage/LiveMetrics";
import HowItWorks from "@/components/LandingPage/HowItWorks";
import EditorialFeatures from "@/components/LandingPage/EditorialFeatures";
import SOLPaymentFlow from "@/components/LandingPage/SOLPaymentFlow";
import UseCases from "@/components/LandingPage/UseCases";
import NetworkMap from "@/components/LandingPage/NetworkMap";
import PricingConfigurator from "@/components/LandingPage/PricingConfigurator";
import FinalCTA from "@/components/LandingPage/FinalCTA";

export default function Landing() {
  return (
    <div className="relative min-h-screen text-zinc-950">
      <GlobalBackground />
      <div className="relative">
        <HeroSection />
        <LiveMetrics />
        <HowItWorks />
        <EditorialFeatures />
        <SOLPaymentFlow />
        <UseCases />
        <NetworkMap />
        <PricingConfigurator />
        <FinalCTA />
      </div>
    </div>
  );
}

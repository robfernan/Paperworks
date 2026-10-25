import HeroSection from "@/components/HeroSection";
import ToolsGrid from "@/components/ToolsGrid";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import ComparisonTable from "@/components/ComparisonTable";

const Index = () => {
  return (
    <main className="space-y-16 sm:space-y-24 pb-16">
      <HeroSection />
      <ToolsGrid />
      <FeaturesShowcase />
      <ComparisonTable />
    </main>
  );
};

export default Index;

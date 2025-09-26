import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ToolsGrid from "@/components/ToolsGrid";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import ComparisonTable from "@/components/ComparisonTable";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ToolsGrid />
        <FeaturesShowcase />
        <ComparisonTable />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

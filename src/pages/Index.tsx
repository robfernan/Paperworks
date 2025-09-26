import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ToolsGrid from "@/components/ToolsGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ToolsGrid />
      </main>
    </div>
  );
};

export default Index;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PdfPro from "./pages/tools/PdfPro";
import BusinessCards from "./pages/tools/BusinessCards";
import ResumeBuilder from "./pages/tools/ResumeBuilder";
import InvoiceCreator from "./pages/tools/InvoiceCreator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/pdf-pro" element={<PdfPro />} />
          <Route path="/tools/business-cards" element={<BusinessCards />} />
          <Route path="/tools/resume" element={<ResumeBuilder />} />
          <Route path="/tools/invoice" element={<InvoiceCreator />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

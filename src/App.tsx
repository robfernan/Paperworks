import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";

const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const DocumentVault = React.lazy(() => import("./pages/DocumentVault"));
const PdfPro = React.lazy(() => import("./pages/tools/PdfPro"));
const BusinessCards = React.lazy(() => import("./pages/tools/BusinessCards"));
const ResumeBuilder = React.lazy(() => import("./pages/tools/ResumeBuilder"));
const InvoiceCreator = React.lazy(() => import("./pages/tools/InvoiceCreator"));

const queryClient = new QueryClient();

const RouteFallback = () => <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 text-sm text-muted-foreground">Loading...</div>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <React.Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="vault" element={<DocumentVault />} />
              <Route path="tools/pdf-pro" element={<PdfPro />} />
              <Route path="tools/business-cards" element={<BusinessCards />} />
              <Route path="tools/resume" element={<ResumeBuilder />} />
              <Route path="tools/invoice" element={<InvoiceCreator />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </React.Suspense>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


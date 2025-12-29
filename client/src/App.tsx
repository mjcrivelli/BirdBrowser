import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AdminProvider } from "@/contexts/AdminContext";
import NotFound from "@/pages/not-found";
import BirdGrid from "@/pages/BirdGrid";
import Memoria from "@/pages/memoria";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BirdGrid} />
      <Route path="/memoria" component={Memoria} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <Router />
        <Toaster />
      </AdminProvider>
    </QueryClientProvider>
  );
}

export default App;

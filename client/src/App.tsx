import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import BirdGrid from "@/pages/BirdGrid";
import Memoria from "@/pages/Memoria";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BirdGrid} />
      <Route path="/memoria" component={Memoria} /> {/* Nova rota */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

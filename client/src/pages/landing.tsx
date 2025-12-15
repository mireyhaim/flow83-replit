import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/generated_images/minimalist_abstract_logo_for_flow_83.png";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex justify-center">
          <img src={logo} alt="Flow 83" className="w-16 h-16 object-contain dark:invert" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tighter">Flow 83</h1>
        <p className="text-lg text-muted-foreground">
          The operating system for transformation.
          <br />
          Turn your method into a journey.
        </p>

        <div className="space-y-4 pt-4">
          <Button size="lg" className="w-full h-12 text-base" onClick={() => setLocation("/dashboard")}>
            Enter Mentor OS
          </Button>
          <p className="text-xs text-muted-foreground">MVP Version 0.1</p>
        </div>
      </div>
    </div>
  );
}

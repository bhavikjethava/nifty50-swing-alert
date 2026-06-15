"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <Button variant="outline" onClick={() => setDark((value) => !value)} aria-label="Toggle dark mode" title="Toggle dark mode">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
}

import { useEffect, useState } from "react";
import api from "../lib/api";

interface BrandConfig {
  name: string;
  slogan: string;
  defaultLanguage: string;
}

const fallback: BrandConfig = {
  name: "PROJECT STAR",
  slogan: "Someone out there is waiting.",
  defaultLanguage: "en",
};

export function useBrandConfig() {
  const [config, setConfig] = useState<BrandConfig>(fallback);

  useEffect(() => {
    api
      .get("/api/app/config")
      .then((res) => setConfig(res.data))
      .catch(() => setConfig(fallback));
  }, []);

  return config;
}

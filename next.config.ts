import { execSync } from "child_process";
import type { NextConfig } from "next";

const gitHash = execSync("git rev-parse --short HEAD").toString().trim();

const nextConfig: NextConfig = {
  output: "standalone",
  generateBuildId: () => gitHash,
};

export default nextConfig;

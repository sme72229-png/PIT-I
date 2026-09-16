import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Origens extras permitidas no servidor de desenvolvimento (Ignored em build
  // de produção): habilita acessar o app durante o dev por outros dispositivos
  // da rede local (ex.: celular no mesmo Wi-Fi, para testar a responsividade).
  allowedDevOrigins: ["192.168.2.112", "192.168.2.112:3100"],
};

export default nextConfig;

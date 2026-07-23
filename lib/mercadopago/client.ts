import { MercadoPagoConfig } from "mercadopago";
import { getMercadoPagoAccessToken } from "./config";

let config: MercadoPagoConfig | null = null;

export function getMercadoPagoClient(): MercadoPagoConfig {
  if (!config) {
    config = new MercadoPagoConfig({
      accessToken: getMercadoPagoAccessToken(),
    });
  }
  return config;
}

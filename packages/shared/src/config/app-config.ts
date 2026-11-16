import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "SISBM CORE",
  version: packageJson.version,
  copyright: `© ${currentYear}, SISBM CORE.`,
  meta: {
    title: "SISBM CORE - Administration",
    description: "Plateforme d'administration SISBM CORE : supervision de flotte, trackers GPS et canaux flespi.",
  },
};

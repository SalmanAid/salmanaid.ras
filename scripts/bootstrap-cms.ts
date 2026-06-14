import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadEnvConfig } from "@next/env";
import {
  defaultBorrowerShell,
  defaultDonorShell,
  defaultLandingContent,
} from "../src/cms/defaults.js";

loadEnvConfig(process.cwd());

const documents = [
  { key: "PUBLIC_LANDING" as const, content: defaultLandingContent },
  { key: "BORROWER_SHELL" as const, content: defaultBorrowerShell },
  { key: "DONOR_SHELL" as const, content: defaultDonorShell },
];

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL atau DATABASE_URL wajib tersedia");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    for (const document of documents) {
      await prisma.cmsDocument.upsert({
        where: { key: document.key },
        create: {
          key: document.key,
          draftContent: document.content,
          publishedContent: document.content,
        },
        update: {},
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("CMS documents are ready.");
  })
  .catch((error) => {
    console.error("CMS bootstrap failed.", error);
    process.exitCode = 1;
  });

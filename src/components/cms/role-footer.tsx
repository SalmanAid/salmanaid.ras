import Link from "next/link";
import type { RoleShellContent } from "@/schemas/cms.schema";

export function RoleFooter({ config }: { config: RoleShellContent }) {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-350 flex-col gap-3 px-6 py-5 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>{config.footer.copyright}</p>
        <nav aria-label="Tautan bantuan" className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href={config.footer.helpHref} className="font-semibold hover:text-[#07B0C8]">{config.footer.helpLabel}</Link>
          <Link href={config.footer.contactHref} className="font-semibold hover:text-[#07B0C8]">{config.footer.contactLabel}</Link>
          <Link href={config.footer.privacyHref} className="font-semibold hover:text-[#07B0C8]">{config.footer.privacyLabel}</Link>
        </nav>
      </div>
    </footer>
  );
}

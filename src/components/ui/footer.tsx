import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import type { PublicLandingContent } from "@/schemas/cms.schema";

export default function Footer({ config }: { config: PublicLandingContent["footer"] }) {
    return (
        <footer className="w-full bg-[#222429] text-gray-300 pt-12 md:pt-14 pb-6 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div>
                        <Image
                            src={config.logoUrl}
                            alt={config.logoAlt}
                            width={138}
                            height={48}
                            className="h-12 w-auto"
                        />
                        <p className="mt-4 text-[13px] leading-relaxed text-gray-400 max-w-[28ch]">
                           {config.description}
                        </p>
                    </div>

                    {config.groups.map((group) => (
                        <div key={group.id}>
                            <h3 className="text-[14px] font-semibold text-white">{group.title}</h3>
                            <ul className="mt-4 space-y-2 text-[13px]">
                                {group.links.map((link) => (
                                    <li key={link.id}><Link href={link.href} className="hover:text-white">{link.label}</Link></li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <h3 className="text-[14px] font-semibold text-white">Hubungi Kami</h3>
                        <ul className="mt-4 space-y-3 text-[13px] text-gray-400">
                            <li className="flex items-start gap-2">
                                <Mail className="w-4 h-4 mt-0.5" />
                                <span>{config.contact.email}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Phone className="w-4 h-4 mt-0.5" />
                                <span>{config.contact.phone}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 mt-0.5" />
                                <span>{config.contact.address}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-700/60 pt-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <p className="text-[12px] text-gray-500">
                        {config.copyright}
                    </p>
                    <div className="flex items-center gap-4 text-[12px] text-gray-500">
                        {config.legalLinks.map((link) => (
                            <Link key={link.id} href={link.href} className="hover:text-gray-300">{link.label}</Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}

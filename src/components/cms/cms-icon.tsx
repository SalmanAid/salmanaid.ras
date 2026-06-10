import {
  BadgeCheck,
  Check,
  DollarSign,
  FileText,
  GraduationCap,
  HandCoins,
  Heart,
  Lock,
  Percent,
  Shield,
  Users,
} from "lucide-react";

const icons = {
  "badge-check": BadgeCheck,
  check: Check,
  dollar: DollarSign,
  "file-text": FileText,
  "graduation-cap": GraduationCap,
  "hand-coins": HandCoins,
  heart: Heart,
  lock: Lock,
  percent: Percent,
  shield: Shield,
  users: Users,
};

export function CmsIcon({
  name,
  className = "h-5 w-5",
}: {
  name: keyof typeof icons | string;
  className?: string;
}) {
  const Icon = icons[name as keyof typeof icons] || FileText;
  return <Icon className={className} aria-hidden="true" />;
}

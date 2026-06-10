import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import { CmsWorkspace } from "@/components/cms/cms-workspace";

export default function AdminLandingCmsPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <AdminDashboard_AdminNavbar />
      <CmsWorkspace />
    </div>
  );
}

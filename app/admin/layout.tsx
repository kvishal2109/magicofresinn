import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
  title: "Admin Panel",
};

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}


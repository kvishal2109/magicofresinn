"use client";

import ResponsiveModal from "@/components/ui/ResponsiveModal";

interface AdminModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: AdminModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      size={size}
    >
      {children}
    </ResponsiveModal>
  );
}

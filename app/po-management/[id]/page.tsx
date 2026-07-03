import POManagementView from "@/app/components/po/POManagementView";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function DynamicPOManagementPage({ params }: PageProps) {
  const poId = params.id;

  if (!poId) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Panggil komponen management dengan menyertakan poId */}
      <POManagementView poId={poId} />
    </div>
  );
}

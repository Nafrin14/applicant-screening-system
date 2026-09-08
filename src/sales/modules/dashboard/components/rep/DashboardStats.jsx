import { FaFolderOpen } from "react-icons/fa";

function Card({ title, value, icon, danger }) {
  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between">
       <p className="text-slate-700 font-semibold">{title}</p>
        <span className="text-2xl text-[#064E3B]">{icon}</span>
      </div>

     <h2
  className={`mt-5 font-extrabold ${
    typeof value === "string" ? "text-3xl" : "text-5xl"
  } ${
    danger
      ? "text-red-600"
      : "text-[#064E3B]"
  }`}
>
        {value}
      </h2>
    </div>
  );
}

export default function DashboardStats({ totalUploads, completedUploads, uploadedToday, missingUploads }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
      <Card title="Total Uploads" value={totalUploads} icon={<FaFolderOpen />} />
      <Card title="Completed" value={completedUploads} icon="✅" />
      <Card
        title="Today Status"
        value={uploadedToday ? "Uploaded" : "Not Uploaded"}
        icon="⚠️"
        danger={!uploadedToday}
      />
      <Card
        title="Missing Upload"
        value={missingUploads}
        icon="❌"
        danger={missingUploads > 0}
      />
    </div>
  );
}

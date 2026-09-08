import { formatJoinedDate } from "../utils/profileFormatters";

export default function ProfileOverviewCard({ stats, createdAt }) {
  return (
    <div className="dashboard-card">
      <h2 className="text-xl font-bold mb-6">Profile Overview</h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Total Uploads</span>
          <span className="font-bold text-[#064E3B]">
            {stats.totalUploads}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Total Reports</span>
          <span className="font-bold text-[#064E3B]">
            {stats.totalReports}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Success Rate</span>
          <span className="font-bold text-[#064E3B]">
            {stats.successRate}%
          </span>
        </div>

        <div className="flex justify-between">
          <span>Member Since</span>
          <span className="font-bold text-[#064E3B]">
            {formatJoinedDate(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

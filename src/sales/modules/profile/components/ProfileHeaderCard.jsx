import { formatJoinedDate, formatLastLogin } from "../utils/profileFormatters";

export default function ProfileHeaderCard({ profile }) {
  return (
    <div className="dashboard-card lg:col-span-2">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative">
          <div className="w-36 h-36 rounded-full bg-[#064E3B] text-white overflow-hidden flex items-center justify-center text-6xl font-black">
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              profile.name?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#064E3B] hover:bg-[#065F46] text-white flex items-center justify-center shadow-lg">
            📷
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-black">
              {profile.name || "User"}
            </h2>

            <span className="px-3 py-1 rounded-full bg-[#064E3B] text-white font-semibold text-sm">
              {profile.role || "User"}
            </span>
          </div>

          <p className="text-slate-600 mt-3">📧 {profile.email}</p>

          <p className="text-slate-600 mt-2">
            📞 {profile.phone || "No phone added"}
          </p>

          <div className="flex flex-wrap gap-6 mt-6">
            <p className="text-slate-600">
              📅 Joined : {formatJoinedDate(profile.created_at)}
            </p>

            <p className="text-slate-600">
              🕒 Last Login : {formatLastLogin(profile.last_login)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

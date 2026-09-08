export default function ProfileImageCard({ profile, onFileSelected }) {
  return (
    <div className="dashboard-card">
      <h2 className="text-xl font-bold mb-6">Profile Image</h2>

      <div className="flex flex-col items-center">
        <div className="w-36 h-36 rounded-full bg-[#064E3B] text-white overflow-hidden flex items-center justify-center text-5xl font-black mb-6">
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

        <label className="bg-[#064E3B] hover:bg-[#065F46] text-white px-6 py-3 rounded-xl font-bold cursor-pointer shadow-md transition-all">
          Upload Image

          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              onFileSelected(file);
            }}
          />
        </label>

        <p className="text-slate-500 text-sm mt-4 text-center">
          JPG, PNG up to 2MB
        </p>
      </div>
    </div>
  );
}

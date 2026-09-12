export default function ProfileEditForm({ profile, setProfile, onSave }) {
  return (
    <div className="dashboard-card lg:col-span-2">
      <h2 className="text-2xl font-bold mb-8">Edit Profile</h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block mb-2 text-slate-600 font-medium">
            Full Name
          </label>

          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile({
                ...profile,
                name: e.target.value,
              })
            }
            className="w-full h-12 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>

        <div>
          <label className="block mb-2 text-slate-600 font-medium">
            Email
          </label>

          <input
            type="email"
            value={profile.email}
            readOnly
            className="w-full h-12 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>

        <div>
          <label className="block mb-2 text-slate-600 font-medium">
            Phone
          </label>

          <input
            type="text"
            value={profile.phone}
            onChange={(e) =>
              setProfile({
                ...profile,
                phone: e.target.value,
              })
            }
            className="w-full h-12 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>

        <div>
          <label className="block mb-2 text-slate-600 font-medium">
            Password
          </label>

          <input
            type="password"
            placeholder="********"
            className="w-full h-12 bg-white border border-[#064E3B] rounded-xl px-4 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#064E3B] shadow-sm"
          />
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={onSave}
          className="bg-[#064E3B] hover:bg-[#065F46] text-white shadow-md transition-all px-8 py-3 rounded-xl font-bold"
        >
          Save Changes
        </button>

        <button className="border border-[#064E3B] text-[#064E3B] hover:bg-[#064E3B] hover:text-white px-8 py-3 rounded-xl transition-all font-bold">
          Cancel
        </button>
      </div>
    </div>
  );
}

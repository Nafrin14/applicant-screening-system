function SettingRow({ label }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-white/70">{label}</span>

      <span className="w-12 h-6 rounded-full bg-emerald-500 relative">
        <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
      </span>
    </div>
  );
}

export default function NotificationSettingsPanel() {
  return (
    <section className="dashboard-card h-fit">
      <h2 className="text-xl font-bold mb-5">
        Notification Settings
      </h2>

      <SettingRow label="Email Notifications" />
      <SettingRow label="Upload Alerts" />
      <SettingRow label="Report Alerts" />
      <SettingRow label="System Alerts" />

      <button className="mt-5 w-full rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 py-3 font-bold">
        ⚙ Manage Preferences
      </button>
    </section>
  );
}

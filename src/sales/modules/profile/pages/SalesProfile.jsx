import SalesSidebar from "../../../components/SalesSidebar";
import SalesNavbar from "../../../components/SalesNavbar";
import { useNotification } from "../../../../core/context/NotificationContext";

import useSalesProfile from "../hooks/useSalesProfile";
import ProfileHeaderCard from "../components/ProfileHeaderCard";
import ProfileOverviewCard from "../components/ProfileOverviewCard";
import ProfileEditForm from "../components/ProfileEditForm";
import ProfileImageCard from "../components/ProfileImageCard";

export default function SalesProfile() {
  const { notify } = useNotification();
  const { profile, setProfile, stats, saveProfile, uploadProfileImage } = useSalesProfile({ notify });

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SalesSidebar />

      <main className="relative z-10 lg:ml-72 min-h-screen">
        <SalesNavbar
          title="Profile"
          subtitle="Manage your account information and preferences."
        />

        <div className="px-6 py-8 md:px-10">
          <section className="grid lg:grid-cols-3 gap-6 mb-6">
            <ProfileHeaderCard profile={profile} />
            <ProfileOverviewCard stats={stats} createdAt={profile.created_at} />
          </section>

          <section className="grid lg:grid-cols-3 gap-6 mb-6">
            <ProfileEditForm profile={profile} setProfile={setProfile} onSave={saveProfile} />
            <ProfileImageCard profile={profile} onFileSelected={uploadProfileImage} />
          </section>
        </div>
      </main>
    </div>
  );
}

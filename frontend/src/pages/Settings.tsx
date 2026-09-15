import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-lav-900">Settings</h1>
        <p className="mt-2 text-lav-700">Manage your profile and bakery preferences.</p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-lav-300 bg-white/50 p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lav-100 text-lav-500">
          <SettingsIcon className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-lav-900">Account Settings</h2>
        <p className="max-w-md text-lav-700">
          Settings configuration will be added here. You'll be able to update your bakery profile, display name, and preferences.
        </p>
      </div>
    </div>
  );
}

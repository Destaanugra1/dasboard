"use client";

import { FormEvent, useState } from "react";
import { CldImage, CldUploadWidget } from "next-cloudinary";

type ProfileFormProps = {
  userId: number;
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
};

type UploadInfo = {
  public_id: string;
};

export function ProfileForm({
  userId,
  initialName,
  initialEmail,
  initialAvatarUrl,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        avatarUrl,
        password: password || undefined,
      }),
    });

    setPending(false);

    if (!response.ok) {
      setError("Failed to save profile");
      return;
    }

    setPassword("");
    setMessage("Profile updated successfully");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-textPrimary">Profile Settings</h2>
        <p className="text-sm text-muted">Update account details and avatar.</p>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-white/5">
            {avatarUrl ? (
              <CldImage
                width={96}
                height={96}
                src={avatarUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>

          <CldUploadWidget
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={(result) => {
              const info = (result as { info?: UploadInfo }).info;
              if (info?.public_id) {
                setAvatarUrl(info.public_id);
              }
            }}
          >
            {({ open }) => (
              <button
                type="button"
                onClick={() => open()}
                className="rounded-xl border border-white/15 px-4 py-2 text-sm"
              >
                Upload Avatar
              </button>
            )}
          </CldUploadWidget>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted">Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="glass-card w-full px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="glass-card w-full px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="text-muted">Change Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Leave empty to keep current password"
              className="glass-card w-full px-3 py-2"
            />
          </label>
        </div>

        {message ? <p className="mt-3 text-sm text-green-300">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-xl bg-accentBlue px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

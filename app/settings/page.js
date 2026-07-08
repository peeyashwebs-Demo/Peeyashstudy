"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";
import { Skel } from "@/components/Skeleton";
import PushOptIn from "@/components/PushOptIn";

export default function Settings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setName(data?.full_name || "");
      setEmail(user.email || "");
      setLoading(false);
    })();
  }, []);

  function flash(type, text) {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  }

  async function saveName(e) {
    e.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    flash(error ? "error" : "success", error ? error.message : "Name updated.");
  }

  async function saveEmail(e) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email });
    flash(error ? "error" : "success", error ? error.message : "Check your new email for a confirmation link before it takes effect.");
  }

  async function savePassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) return flash("error", "Password must be at least 6 characters.");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    flash(error ? "error" : "success", error ? error.message : "Password updated.");
    if (!error) setNewPassword("");
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      setAvatarUploading(false);
      const hint = uploadError.message?.toLowerCase().includes("bucket")
        ? "The 'avatars' storage bucket hasn't been created yet in Supabase — see setup guide."
        : uploadError.message;
      return flash("error", "Upload failed: " + hint);
    }

    const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = `${publicUrlData.publicUrl}?t=${Date.now()}`; // cache-bust so the new photo shows immediately

    const { error: updateError } = await supabase.from("profiles").update({ avatar_url }).eq("id", user.id);
    setAvatarUploading(false);
    if (updateError) return flash("error", updateError.message);

    setProfile((p) => ({ ...p, avatar_url }));
    flash("success", "Photo updated.");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function deleteAccount() {
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setDeleting(false);
      return flash("error", data.error || "Something went wrong.");
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <>
        <Nav authed />
        <main className="max-w-lg mx-auto px-5 py-10">
          <Skel className="h-7 w-32 mb-8" />
          <Skel className="h-24 w-24 rounded-full mb-8" />
          <Skel className="h-40 w-full rounded-xl mb-4" />
          <Skel className="h-40 w-full rounded-xl" />
        </main>
      </>
    );
  }

  return (
    <>
      <Nav authed />
      <main className="max-w-lg mx-auto px-5 py-10">
        <h1 className="font-display text-2xl font-semibold mb-8">Settings</h1>

        {msg.text && (
          <div className={`mb-6 rounded-xl px-4 py-3 text-sm ${msg.type === "success" ? "bg-leaf/10 text-leaf border border-leaf/30" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {msg.text}
          </div>
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-line overflow-hidden flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-2xl text-ink/40">{name?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div>
            <button onClick={() => fileRef.current?.click()} disabled={avatarUploading}
              className="border border-line rounded-full px-4 py-2 text-sm font-medium hover:border-biro transition-colors">
              {avatarUploading ? "Uploading…" : "Change photo"}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            <p className="text-xs text-ink/50 mt-1.5">JPG or PNG, up to a few MB.</p>
          </div>
        </div>

        {/* Name */}
        <form onSubmit={saveName} className="border border-line rounded-2xl p-5 mb-4">
          <p className="text-sm font-medium mb-3">Full name</p>
          <div className="flex gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-line rounded-lg px-4 py-2.5 text-base sm:text-sm focus-ring" />
            <button className="bg-ink text-paper px-4 rounded-lg text-sm font-medium hover:bg-biro transition-colors">Save</button>
          </div>
        </form>

        {/* Email */}
        <form onSubmit={saveEmail} className="border border-line rounded-2xl p-5 mb-4">
          <p className="text-sm font-medium mb-1">Email</p>
          <p className="text-xs text-ink/50 mb-3">Changing this sends a confirmation link to the new address.</p>
          <div className="flex gap-2">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-line rounded-lg px-4 py-2.5 text-base sm:text-sm focus-ring" />
            <button className="bg-ink text-paper px-4 rounded-lg text-sm font-medium hover:bg-biro transition-colors">Save</button>
          </div>
        </form>

        {/* Notifications */}
        <PushOptIn />

        {/* Password */}
        <form onSubmit={savePassword} className="border border-line rounded-2xl p-5 mb-4">
          <p className="text-sm font-medium mb-3">Change password</p>
          <div className="flex gap-2">
            <input type="password" placeholder="New password (6+ characters)" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 border border-line rounded-lg px-4 py-2.5 text-base sm:text-sm focus-ring" />
            <button className="bg-ink text-paper px-4 rounded-lg text-sm font-medium hover:bg-biro transition-colors">Update</button>
          </div>
        </form>

        {/* Read-only info */}
        <div className="border border-line rounded-2xl p-5 text-sm text-ink/60 mb-8">
          <p>School: <span className="text-ink font-medium">{profile?.school || "MIVA"}</span></p>
          <p className="mt-1">Referral code: <span className="text-ink font-medium font-mono">{profile?.referral_code}</span></p>
        </div>

        {/* Logout */}
        <button onClick={logout}
          className="w-full border border-line rounded-full py-3 text-sm font-medium hover:border-ink transition-colors mb-8">
          Log out
        </button>

        {/* Delete account — deliberately separated and harder to trigger */}
        <div className="border border-red-200 rounded-2xl p-5">
          <p className="text-sm font-medium text-red-700 mb-1">Delete account</p>
          <p className="text-xs text-ink/50 mb-3">
            This permanently deletes your account, uploads, wallet balance, and history.
            This cannot be undone.
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="text-sm text-red-700 border border-red-200 rounded-full px-4 py-2 hover:bg-red-50 transition-colors">
              Delete my account
            </button>
          ) : (
            <div>
              <p className="text-xs text-ink/60 mb-2">Type <span className="font-mono font-semibold">DELETE</span> to confirm.</p>
              <div className="flex gap-2">
                <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="flex-1 border border-red-200 rounded-lg px-3 py-2 text-base sm:text-sm focus-ring" />
                <button onClick={deleteAccount} disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="bg-red-600 text-paper px-4 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-red-700 transition-colors">
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="text-xs text-ink/40 underline mt-2">Cancel</button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

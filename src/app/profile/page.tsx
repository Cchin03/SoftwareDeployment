"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import Navbar from "../../components/navbar";

const supabase = createClient();

export default function ProfilePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  } | null>(null);

  const navbarUser = supabaseUser
    ? {
        name: supabaseUser.user_metadata?.name ?? supabaseUser.email ?? "User",
        email: supabaseUser.email ?? "",
      }
    : null;

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setSupabaseUser(user);

      // profiles only has id, role, name, created_at — no email column,
      // so we don't select it here. Email comes from the auth user object.
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load profile:", error);
      } else if (profile) {
        setName(profile.name ?? "");
      }

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  // Get first letter of name for the avatar circle
  const avatarLetter = name ? name.charAt(0).toUpperCase() : "";

  if (loading) {
    return (
      <main>
        <section style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#6b7280" }}>Loading...</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <Navbar user={navbarUser} showCart={true} showNavLinks={true} />

      <section style={{ minHeight: "80vh", backgroundColor: "#f9fafb", padding: "48px 16px" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", backgroundColor: "white", borderRadius: "8px", padding: "40px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>

        <div style={{maxWidth: "100px", height: "100px", backgroundColor: "#6666FF", borderRadius: "50%", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <h1 style={{ fontSize: "55px", textAlign: "center", color: "#ffffff" }}>{avatarLetter}</h1>
        </div>

          {/* Avatar section */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "32px" }}>
            <p style={{ color: "#6b7280", fontSize: "15px", fontWeight: "600" }}>Profile </p>
          </div>

          {/* Name field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Full Name</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              {name}
            </div>
          </div>

          {/* Email field */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Email</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              {supabaseUser?.email ?? ""}
            </div>
          </div>

          {/* Role info */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>Role</label>
            <div style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "4px", fontSize: "14px", backgroundColor: "#f9fafb", color: "#374151" }}>
              User
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
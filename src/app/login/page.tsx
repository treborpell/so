
"use client";

import { useAuth } from "@/firebase/provider";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    setIsRedirecting(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      alert("Redirection failed: " + error.message);
      setIsRedirecting(false);
    }
  };

  if (loading || isRedirecting) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
        <p>Syncing Session...</p>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: '900' }}>Mindful Tracker</h1>
      <Button 
        onClick={handleGoogleLogin} 
        style={{ padding: '2rem 4rem', fontSize: '1.25rem', fontWeight: '900', borderRadius: '1rem' }}
      >
        Sign in with Google
      </Button>
    </div>
  );
}

export default function LoginPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return <LoginContent />;
}

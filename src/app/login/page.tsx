
"use client";

import { useAuth } from "@/firebase/provider";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function LoginContent() {
  const { user, loading, auth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Signed In", description: "Accessing dashboard..." });
      router.replace("/");
    } catch (error: any) {
      toast({ 
        title: "Access Denied", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Mindful Secure Access</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="bg-primary text-primary-foreground p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-2xl shadow-black/20">
              <BrainCircuit className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight leading-none mb-2">Mindful Tracker</CardTitle>
          <CardDescription className="text-primary-foreground/80 font-bold uppercase text-[10px] tracking-[0.2em]">
            Private Dashboard Access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Admin Identity</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold pl-12 shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" icon-label="true" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Master Key</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold pl-12 pr-12 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : "Enter Dashboard"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-300 font-bold uppercase tracking-[0.2em] pt-8">
            Personal Use Only
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"></div>;
  }

  return <LoginContent />;
}

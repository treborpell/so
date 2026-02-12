
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  browserSessionPersistence,
  setPersistence
} from "firebase/auth"
import { useAuth, useUser } from "@/firebase/provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { BrainCircuit, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const { auth } = useAuth()
  const { user, isUserLoading } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)

  // Combined listener for both direct state and redirect results
  useEffect(() => {
    if (!auth) return;

    const handleAuth = async () => {
      // 1. If already logged in, go home
      if (user) {
        console.log("LoginPage: User is authenticated. Redirecting to home.");
        router.replace("/");
        return;
      }

      // 2. Check if we just returned from a redirect
      try {
        console.log("LoginPage: Checking getRedirectResult...");
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("LoginPage: Redirect success. User:", result.user.email);
          router.replace("/");
          return;
        }
      } catch (error: any) {
        console.error("LoginPage: Redirect result error", error);
        toast({ title: "Sign-In Error", description: error.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuth();
  }, [auth, user, router, toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await setPersistence(auth, browserSessionPersistence);
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      // Redirect handled by useEffect
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    
    setIsLoading(true)
    try {
      await setPersistence(auth, browserSessionPersistence);
      console.log("LoginPage: Triggering Google Redirect...");
      await signInWithRedirect(auth, provider)
    } catch (error: any) {
      toast({ title: "Failed to connect", description: error.message, variant: "destructive" })
      setIsLoading(false)
    }
  }

  if (isUserLoading || isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p>Syncing Session...</p>
      </div>
    )
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
            Therapeutic Companion
          </CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-8">
          <Button 
            variant="outline" 
            className="w-full h-16 rounded-2xl font-black text-lg border-2 border-slate-100 hover:bg-slate-50 transition-all flex items-center justify-center gap-4 shadow-sm" 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
              <>
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2 border-slate-50" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.3em] text-slate-300">
              <span className="bg-white px-6 italic">Secure Gateway</span>
            </div>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Email Identity</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold px-6 shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" icon-label="true" className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Access Key</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 rounded-2xl bg-slate-50 border-none focus-visible:ring-2 focus-visible:ring-primary font-bold px-6 shadow-inner"
              />
            </div>
            <Button className="w-full h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isRegistering ? "Confirm Registration" : "Enter Dashboard")}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 font-bold uppercase tracking-widest pt-4">
            {isRegistering ? "Returning member?" : "New journey?"}{" "}
            <button 
              type="button" 
              className="text-primary font-black hover:underline"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? "Sign In" : "Register"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { useContext, useState, createContext, useEffect } from "react";
import { supabase } from "../lib/supabase";


export const AuthContext = createContext(null);

export function AuthProvider ({children}) {
    const [user, setUser]= useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        supabase.auth.getSession().then(({data, error})=>{
            if(error) setUser(null);
            else{
                setUser(data.session?.user ?? null)
            }
            setLoading(false);
        });

        const {data: listener} = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log(event);
                setUser(session?.user ?? null);
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        }

    },[]);

    async function  signUp (email, password){
        return supabase.auth.signUp({email, password})
    }

    async function login(email, password) {
        return supabase.auth.signInWithPassword({email, password})
    }

    async function loginWithGoogle() {
        return supabase.auth.signInWithOAuth({
            provider:'google',
            options:{redirectTo: window.location.origin}
        })

    }

    async function logout (){
        return supabase.auth.signOut();
    }

    return (
        <AuthContext.Provider
        value={{user, loading, signUp, login, loginWithGoogle, logout}}
        >
            {children}
        </AuthContext.Provider>
    )

}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if(!ctx){
        throw new Error("useAuth must be used inside Auth Provider")
    }
    console.log(`Context from useAuth: ${JSON.stringify(ctx)}`);

    return ctx;
}
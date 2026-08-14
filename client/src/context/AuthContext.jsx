import { supabase } from "../lib/supabase";

import { createContext } from "react";

export const AuthContext = createContext(null);

const AuthProvider = ({user}) => {
    await supabase.auth.

}
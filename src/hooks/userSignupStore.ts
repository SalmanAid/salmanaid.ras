

import { create } from "zustand"
import { User }  from "@/types/user"

type UserSignUpStore = {
    // these are the variables that the store store
    user: User | null
    password : string
    role: string | null

    // these are functions to call and define the create() section of zustand
    setUser: (u: User) => void
    setRole : (r : string) => void
    setPassword : (p : string) => void
    logout : () => void

    isLoggedIn: () => boolean
}

export const useUserSignUpStore = create<UserSignUpStore>((set, get) => ({
    user : null,
    role : null,
    password : "",
    
    setUser(u) {
        set({ user : u })
    },
    
    setRole(r) {
        set({ role : r })
    },

    setPassword(p) {
        set({ password : p })
    },

    logout() {
        set({ user : null})
    },

    isLoggedIn : () => get().user !== null,
}))
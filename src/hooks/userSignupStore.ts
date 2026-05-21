

import { create } from "zustand"
import { User }  from "@/types/user"

type UserSignUpStore = {
    // these are the variables that the store store
    user: User
    password : string
    role: string | null

    // these are functions to call and define the create() section of zustand
    setUser: (u: User) => void
    setRole : (r : string) => void
    setPassword : (p : string) => void
    setEmail : (e : string) => void
    clear : () => void

    isLoggedIn: () => boolean
}

export const useUserSignUpStore = create<UserSignUpStore>((set, get) => ({
    user : {
        username : "",
        email : "",
        id : "",
    },
    role : "",
    password : "",
    
    setEmail: (e : string) =>
        set((state) => ({
            user: {
                ...state.user,
                email: e, // Explicitly map 'e' to the 'email' property
            }
        })),
    
    setUser(u) {
        set({ user : u })
    },
    
    setRole(r) {
        set({ role : r })
    },

    setPassword(p) {
        set({ password : p })
    },

    clear() {
        set({
            user : {
                username : "",
                email : "",
                id : "",
            },
            role : "",
            password : "",
        })
    },

    isLoggedIn : () => get().user !== null,
}))
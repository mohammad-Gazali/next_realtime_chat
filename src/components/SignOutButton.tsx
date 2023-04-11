"use client";

import { ButtonHTMLAttributes, FC, ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import Icons from "./Icons";



interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

const SignOutButton: FC<SignOutButtonProps> = ({ ...props }) => {
	const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutLogo, setSignOutLogo] = useState<ReactNode>(null);
    const [loaderLogo, setLoaderLogo] = useState<ReactNode>(null);

    useEffect(() => {
        setSignOutLogo(<Icons.LogOut className="w-4 h-4" />)
        setLoaderLogo(<Icons.Loader2 className="animate-spin w-4 h-4" />)
    }, [])


    const handleClick = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
        } catch (error) {
            toast.error("There was a problem signing out");
        } finally {
            setIsSigningOut(false);
        }
    }

	return (
        <Button {...props} disabled={isSigningOut} variant="ghost" onClick={handleClick}>
            {isSigningOut ? loaderLogo : signOutLogo}
        </Button>
    );
};

export default SignOutButton;

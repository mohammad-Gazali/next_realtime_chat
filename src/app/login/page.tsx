"use client";

import { Button } from "@/components/ui";
import { useState, useEffect, ReactNode } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { Icons } from "@/components";

const page = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [googleLogo, setGoogleLogo] = useState<ReactNode>(null);
	const [appLogo, setAppLogo] = useState<ReactNode>(null);

	//? I used "useEffect" and "useState" for google logo because of strange hydration error, and the solution to this problem to run the logic inside "useEffect".

	useEffect(() => {
		setGoogleLogo(Icons.googleLogo);
		setAppLogo(Icons.bigAppLogo);
	}, []);

	const loginWithGoogle = async () => {
		setIsLoading(true);
		try {
			await signIn("google");
		} catch (error) {
			toast.error("Something went wrong with your login");
			console.log(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<div className="flex h-full items-center justify-center py-12 lg:px-8 sm:px-6 px-4">
				<div className="w-full flex flex-col items-center max-w-md space-y-8">
					<div className="flex flex-col items-center gap-8">
						<div className="inline-flex justify-center items-center w-[100px] h-[100px] rounded-full bg-indigo-600 text-white">
							{appLogo}
						</div>
						<h2 className="mt-6 text-center text-xl font-bold tracking-tight text-gray-900">
							Sign In To Your Account
						</h2>
					</div>
					<Button
						isLoading={isLoading}
						type="button"
						className="max-w-sm mx-auto w-full"
						onClick={loginWithGoogle}
					>
						{isLoading ? null : googleLogo}
						Google
					</Button>
				</div>
			</div>
		</>
	);
};

export default page;

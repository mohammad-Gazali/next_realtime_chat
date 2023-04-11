"use client";

import { Button } from "@/components/ui";
import addFriendValidator from "@/utils/validation/add-friend";
import axios, { AxiosError } from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";



type AddFriendFormData = z.infer<typeof addFriendValidator>;

const AddFriendButton = () => {
	const [showSuccessState, setShowSuccessState] = useState(false);

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors },
	} = useForm<AddFriendFormData>({
		resolver: zodResolver(addFriendValidator),
	});

	const addFriend = async (email: string) => {
		try {
			const validatedEmail = addFriendValidator.parse({ email });

			await axios.post("/api/friends/add", {
				email: validatedEmail,
			});

			setShowSuccessState(true);
		} catch (error) {
			if (error instanceof z.ZodError) {
				setError("email", {
					message: error.message,
				});
			}

			else if (error instanceof AxiosError) {
				setError("email", {
					message: error.response?.data,
				});
			}

			else {
				setError("email", {
					message: "Something went wrong.",
				});
			}

		}
	};

	const onSubmitAddFriend = (data: AddFriendFormData) => {
		addFriend(data.email);
	};

	return (
		<form onSubmit={handleSubmit(onSubmitAddFriend)} className="max-w-sm">
			<label
				htmlFor="email"
				className="block text-sm font-medium leading-6 text-gray-900"
			>
				Add friend by E-Mail
			</label>
			<div className="mt-2 flex gap-4">
				<input
					{...register("email")}
					type="text"
					className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
					placeholder="you@example.com"
				/>
				<Button>Add</Button>
			</div>
			<p className="mt-1 text-sm font-medium text-red-600">
        {errors.email?.message}
      </p>
      {showSuccessState ? (
        <p className="mt-1 text-sm font-medium text-green-600">
          Friend request was sent!
        </p>
      ) : null}
		</form>
	);
};

export default AddFriendButton;

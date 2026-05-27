"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface PayloadUserUpdate {
  name: string;
  email: string;
  imageUrl: string;
}

export async function updateProfile(
  userId: string,
  formData: PayloadUserUpdate,
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: {email: formData.email}
    });

    if (existingUser) return { success: false, user: null, error: "Email already registed with another account!"};

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: formData.name,
        email: formData.email,
        imageUrl: formData.imageUrl,
      },
    });

    revalidatePath("/account");
    return { success: true, user: updatedUser, error: null };
  } catch (error) {
    console.log("Update profile error: ", error);
    return {
      success: false,
      user: null,
      error: "An unexpected error occured while updating profile",
    };
  }
}

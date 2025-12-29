"use server";

import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signUpAction(
  prevState: { error?: string } | null | undefined,
  formData: FormData
): Promise<{ error?: string } | null | undefined> {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = signUpSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  const { name, email, password } = validated.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      error: "Email already exists",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "STAFF",
    },
  });

  redirect("/sign-in");
}

export async function signInAction(
  prevState: { error?: string } | null | undefined,
  formData: FormData
): Promise<{ error?: string } | null | undefined> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = signInSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  const { email, password } = validated.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Invalid email or password",
      };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}


import { z } from "zod";
import { isValidUsPhone, looksLikeEmail } from "@/lib/phone";

const passwordSchema = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character");

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .or(z.literal(""));

const optionalPhone = z.string().trim().optional().or(z.literal(""));

// Sign-up schema — members register with EITHER an email OR a phone (one
// required, both allowed). `contactMethod` says which channel they want to
// verify now; that channel's field is required and validated.
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50)
      .trim(),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50)
      .trim(),
    contactMethod: z.enum(["email", "phone"]),
    email: optionalEmail,
    phone: optionalPhone,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      error: "You must accept the terms",
    }),
    honeypot: z.string().max(0, "Bot detected"), // Hidden honeypot field
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  // The chosen channel must be present and valid.
  .refine(
    (data) =>
      data.contactMethod !== "email" ||
      (!!data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)),
    { message: "Please enter a valid email address", path: ["email"] }
  )
  .refine(
    (data) =>
      data.contactMethod !== "phone" ||
      (!!data.phone && isValidUsPhone(data.phone)),
    { message: "Please enter a valid phone number", path: ["phone"] }
  )
  // If the OTHER (optional) field is filled in, it must still be valid.
  .refine(
    (data) =>
      !data.email ||
      data.contactMethod === "email" ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    { message: "Please enter a valid email address", path: ["email"] }
  )
  .refine(
    (data) =>
      !data.phone ||
      data.contactMethod === "phone" ||
      isValidUsPhone(data.phone),
    { message: "Please enter a valid phone number", path: ["phone"] }
  );

// Login — a single identifier field accepts either an email or a phone number.
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, "Enter your email or phone number")
    .refine(
      (val) => (looksLikeEmail(val) ? true : isValidUsPhone(val)),
      "Enter a valid email address or phone number"
    ),
  password: z.string().min(1, "Password is required"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .trim()
    .toLowerCase(),
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

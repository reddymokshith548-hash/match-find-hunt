import { z } from 'zod';

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(128, { message: "Password must be less than 128 characters" })
});

// Sign up validation schema
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Please enter a valid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
    }),
  confirmPassword: z.string(),
  fullName: z.string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters long" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Full name can only contain letters and spaces" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile validation schema
export const profileSchema = z.object({
  name: z.string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s]+$/, { message: "Name can only contain letters and spaces" }),
  bio: z.string()
    .trim()
    .min(10, { message: "Bio must be at least 10 characters long" })
    .max(500, { message: "Bio must be less than 500 characters" }),
  role: z.string()
    .min(1, { message: "Please select a role" }),
  skills: z.array(z.string())
    .min(1, { message: "Please select at least one skill" })
    .max(10, { message: "You can select up to 10 skills" }),
  interests: z.array(z.string())
    .min(1, { message: "Please select at least one interest" })
    .max(10, { message: "You can select up to 10 interests" }),
  stage: z.string()
    .min(1, { message: "Please select your current stage" }),
  looking_for: z.array(z.string())
    .min(1, { message: "Please select what you're looking for" })
    .max(5, { message: "You can select up to 5 options" }),
  profile_pic_url: z.string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal(''))
});

// Message validation schema
export const messageSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: "Message cannot be empty" })
    .max(1000, { message: "Message must be less than 1000 characters" })
});

// Project validation schema
export const projectSchema = z.object({
  title: z.string()
    .trim()
    .min(3, { message: "Project title must be at least 3 characters long" })
    .max(100, { message: "Project title must be less than 100 characters" }),
  description: z.string()
    .trim()
    .min(10, { message: "Project description must be at least 10 characters long" })
    .max(1000, { message: "Project description must be less than 1000 characters" }),
  needs: z.array(z.string())
    .min(1, { message: "Please specify what you need for this project" })
    .max(10, { message: "You can specify up to 10 needs" })
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;